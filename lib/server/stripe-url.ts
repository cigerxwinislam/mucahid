'use server';

import type Stripe from 'stripe';
import { createSupabaseAppServerClient } from './server-utils';
import {
  getActiveSubscriptions,
  getStripe,
  isRestoreableSubscription,
} from './stripe';
import { type Result, errStr, ok } from '../result';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function getCheckoutUrl(
  priceId?: string,
  teamName?: string,
  seatQuantity = 1,
): Promise<Result<string>> {
  const supabase = await createSupabaseAppServerClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    return errStr('User not found');
  }
  const productId = process.env.STRIPE_PRODUCT_ID;
  if (typeof productId !== 'string') {
    return errStr('Missing Stripe product ID');
  }

  const stripe = getStripe();

  let customer = null;
  // check if customer exists, if not create them
  const customers = await stripe.customers.list({ email: user.email });
  if (customers.data.length === 0) {
    customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    });
  } else {
    for (const existingCustomer of customers.data) {
      // check if customer already has an active subscription
      const subscriptions = await getActiveSubscriptions(
        stripe,
        existingCustomer.id,
      );
      const restoreable = subscriptions.data.some((subscription) => {
        return isRestoreableSubscription(subscription);
      });
      if (restoreable) {
        return errStr(
          'Try to restore your subscription. You already have an active subscription.',
        );
      }
      customer = existingCustomer;
    }
  }

  if (
    customer &&
    (!customer.metadata.userId || customer.metadata.userId !== user.id)
  ) {
    await stripe.customers.update(customer.id, {
      metadata: { userId: user.id },
    });
  }

  let finalPriceId: string;
  if (priceId) {
    finalPriceId = priceId;
  } else {
    const price = await retrievePriceAndValidation(stripe, productId);
    finalPriceId = price.id;
  }

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    price: finalPriceId,
    quantity: seatQuantity,
  };

  if (teamName) {
    lineItem.adjustable_quantity = {
      enabled: true,
      minimum: 1,
      maximum: 1000,
    };
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer: customer?.id,
    line_items: [lineItem],
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_RETURN_URL,
  };

  if (teamName) {
    sessionParams.subscription_data = {
      metadata: {
        teamName: teamName,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (session.url === null) {
    return errStr('Missing checkout URL');
  }

  return ok(session.url);
}

async function retrievePriceAndValidation(
  stripe: Stripe,
  productId: string,
): Promise<Stripe.Price> {
  const product = await stripe.products.retrieve(productId);
  const priceId = product.default_price;
  if (product.active === false || typeof priceId !== 'string') {
    throw new Error('Product is not active or has no price');
  }

  const price = await stripe.prices.retrieve(priceId);
  if (price.active === false) {
    throw new Error('Price is not active');
  }
  return price;
}

export async function getBillingPortalUrl(): Promise<Result<string>> {
  try {
    const supabase = await createSupabaseAppServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return errStr('User not found');
    }

    if (
      !process.env.NEXT_PUBLIC_CONVEX_URL ||
      !process.env.CONVEX_SERVICE_ROLE_KEY
    ) {
      return errStr('Missing Convex configuration');
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    const subscription = await convex.query(
      api.subscriptions.getSubscriptionByUserIdPublic,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY,
        userId: user.id,
      },
    );

    if (!subscription) {
      return errStr('Subscription not found');
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customer_id,
      return_url: process.env.STRIPE_RETURN_URL,
    });
    if (session.url === null) {
      return errStr('Missing checkout URL');
    }
    return ok(session.url);
  } catch (error) {
    console.error('Error getting subscription for billing portal:', error);
    return errStr('Failed to get subscription information');
  }
}

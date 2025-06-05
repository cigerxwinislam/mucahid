import { getServerUser } from '@/lib/server/server-chat-helpers';
import {
  getActiveSubscriptions,
  getCustomersByEmail,
  getStripe,
  isRestoreableSubscription,
} from '@/lib/server/stripe';
import { unixToDateString } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST() {
  try {
    const user = await getServerUser();

    const stripe = getStripe();
    const email = user.email;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 },
      );
    }

    const customers = await getCustomersByEmail(stripe, email);
    if (customers.length === 0) {
      return NextResponse.json(
        { message: 'You have no subscription to restore.' },
        { status: 200 },
      );
    }

    for (const customer of customers) {
      const subscriptions = await getActiveSubscriptions(stripe, customer.id);
      for (const subscription of subscriptions.data) {
        if (isRestoreableSubscription(subscription)) {
          const restoredItem = await restoreToDatabase(
            stripe,
            user,
            subscription.id,
          );
          if (restoredItem.type === 'error') {
            return NextResponse.json(
              { error: restoredItem.error },
              { status: 400 },
            );
          }
          return NextResponse.json(
            { subscription: restoredItem.value },
            { status: 200 },
          );
        }
      }
    }

    return NextResponse.json(
      { message: 'No subscription to restore' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error restoring subscription:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

async function restoreToDatabase(
  stripe: Stripe,
  user: User,
  subscriptionId: string,
): Promise<{ type: 'error'; error: string } | { type: 'ok'; value: any }> {
  try {
    // Retrieve the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Ensure the subscription has a valid customer ID from Stripe
    if (!subscription.customer || typeof subscription.customer !== 'string') {
      return { type: 'error', error: 'invalid customer value' };
    }

    // Determine the plan type and team name
    const planType = subscription.metadata.teamName ? 'team' : 'pro';
    const teamName = subscription.metadata.teamName || null;

    // Get the quantity (number of seats) for team plans
    const quantity = subscription.items.data[0].quantity || 1;

    // Use Convex to upsert the subscription
    await convex.mutation(api.subscriptions.upsertSubscription, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      subscriptionId,
      userId: user.id,
      customerId: subscription.customer,
      status: subscription.status,
      startDate: unixToDateString(subscription.current_period_start),
      cancelAt: subscription.cancel_at
        ? unixToDateString(subscription.cancel_at)
        : null,
      canceledAt: subscription.canceled_at
        ? unixToDateString(subscription.canceled_at)
        : null,
      endedAt: subscription.ended_at
        ? unixToDateString(subscription.ended_at)
        : null,
      planType,
      teamName: teamName || undefined,
      quantity,
      userEmail: user.email, // Required for team subscriptions to create owner invitation
    });

    // Get the restored subscription using the public query
    const restoredSubscription = await convex.query(
      api.subscriptions.getSubscriptionByUserIdPublic,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        userId: user.id,
      },
    );

    if (!restoredSubscription) {
      return { type: 'error', error: 'subscription not found after restore' };
    }

    return { type: 'ok', value: restoredSubscription };
  } catch (error) {
    console.error('Error restoring subscription to database:', error);
    return { type: 'error', error: 'error upserting subscription' };
  }
}

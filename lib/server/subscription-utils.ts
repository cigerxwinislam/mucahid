import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { SubscriptionStatus } from '@/types';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Get subscription information for a user
 * This function is meant to be called from the server side
 */
export async function getSubscriptionInfo(
  userId: string,
): Promise<{ planType: SubscriptionStatus }> {
  try {
    // Use the combined subscription check from Convex
    const subscriptionInfo = await convex.query(
      api.subscriptions.checkSubscription,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        userId,
      },
    );

    return {
      planType: subscriptionInfo.planType,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    // Return free tier on error
    return {
      planType: 'free',
    };
  }
}

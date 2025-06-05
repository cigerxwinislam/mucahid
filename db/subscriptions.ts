import { makeAuthenticatedRequest } from '@/lib/api/convex';

export async function getSubscriptionByUserId(userId: string) {
  // Development override: Set NEXT_PUBLIC_OVERRIDE_SUBSCRIPTION_TYPE=pro|free in .env
  // to bypass database subscription checks and force a specific subscription type
  const envSubscriptionType =
    process.env.NEXT_PUBLIC_OVERRIDE_SUBSCRIPTION_TYPE?.toLowerCase();
  if (envSubscriptionType === 'pro' || envSubscriptionType === 'free') {
    return {
      id: 'env-override',
      subscription_id: 'sub_env_override',
      user_id: userId,
      customer_id: 'cus_env_override',
      created_at: new Date().toISOString(),
      status: 'active',
      start_date: new Date().toISOString(),
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      plan_type: envSubscriptionType,
      team_name: null,
      quantity: 1,
      team_id: null,
    };
  }

  try {
    const data = await makeAuthenticatedRequest('/api/subscriptions', 'POST', {
      type: 'getSubscriptionByUserId',
    });

    return data?.data || null;
  } catch (error) {
    console.error('Error fetching subscription by user ID:', error);
    return null;
  }
}

export async function getSubscriptionByTeamId(teamId: string) {
  try {
    const data = await makeAuthenticatedRequest('/api/subscriptions', 'POST', {
      type: 'getSubscriptionByTeamId',
      teamId,
    });

    return data?.data || null;
  } catch (error) {
    console.error('Error fetching subscription by team ID:', error);
    return null;
  }
}

import { createClient } from '@/lib/supabase/server';
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

export async function getServerUser() {
  'use server';

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function getAIProfile() {
  'use server';

  const supabase = await createClient();

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    throw new Error('User not found');
  }

  // Use Convex to get AI profile
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const profile = await convex.mutation(api.profiles.getAIProfilePublic, {
    serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
    userId: user.id,
  });

  return { user, profile };
}

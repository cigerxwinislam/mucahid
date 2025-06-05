'use client';

import { PentestGPTContext } from '@/context/context';
import { getProfileByUserId } from '@/db/profiles';
import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';

export default function SetupPage() {
  const { setProfile, fetchStartingData, user } = useContext(PentestGPTContext);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getProfileByUserId();
      setProfile(profile);

      if (!profile) {
        throw new Error('Profile not found');
      }

      await fetchStartingData();

      router.push(`/c`);
    })();
  }, []);

  return null;
}

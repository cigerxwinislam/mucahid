'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useContext } from 'react';
import { PentestGPTContext } from '@/context/context';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { isPremiumSubscription } = useContext(PentestGPTContext);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: `${process.env.NEXT_PUBLIC_APP_URL}/ingest`,
      ui_host: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}`,
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      autocapture: false, // Disable automatic event capture, as we capture manually
      disable_session_recording: true, // Disable session recording by default
    });

    // Only start session recording for premium users
    if (isPremiumSubscription) {
      posthog.startSessionRecording();
    }
  }, [isPremiumSubscription]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

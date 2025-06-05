'use client';

import { Brand } from '@/components/ui/brand';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <Brand />

      <Link
        className="mt-4 flex w-[200px] items-center justify-center rounded-md bg-blue-500 p-2 font-semibold text-white"
        href="/login"
      >
        Start Chatting
        <ArrowRight className="ml-1" size={20} />
      </Link>

      <div className="mt-8 flex gap-4 text-sm text-muted-foreground">
        <Link
          href="/privacy-policy"
          className="hover:text-primary transition-colors"
        >
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-primary transition-colors">
          Terms of Use
        </Link>
      </div>
    </div>
  );
}

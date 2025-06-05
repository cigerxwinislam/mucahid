'use client';

import { type FC, useEffect, useState, memo } from 'react';
import { PentestGPTSVG } from '../icons/pentestgpt-svg';
import { useTheme } from 'next-themes';

interface BrandProps {
  forceTheme?: 'dark' | 'light';
  scale?: number;
}

const BrandBase: FC<BrandProps> = memo(({ forceTheme, scale = 0.4 }) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted
    ? theme === 'system'
      ? systemTheme
      : theme
    : 'dark';
  const brandTheme = forceTheme || (currentTheme === 'dark' ? 'dark' : 'light');

  return (
    <div className="flex cursor-pointer flex-col items-center">
      <div className="mb-2">
        <PentestGPTSVG theme={brandTheme} scale={scale} />
      </div>
      {scale === 0.4 && (
        <div className="text-3xl font-bold tracking-wide">PentestGPT</div>
      )}
    </div>
  );
});

BrandBase.displayName = 'BrandBase';

export const Brand: FC<BrandProps> = (props) => (
  <BrandBase {...props} scale={0.4} />
);
export const BrandSmall: FC<BrandProps> = (props) => (
  <BrandBase {...props} scale={0.25} />
);
export const BrandLarge: FC<BrandProps> = (props) => (
  <BrandBase {...props} scale={0.3} />
);

import { LoaderCircle } from 'lucide-react';
import type { FC } from 'react';

export const ScreenLoader: FC = () => {
  return (
    <div className="flex size-full flex-col items-center justify-center">
      <LoaderCircle className="mt-4 size-12 animate-spin" />
    </div>
  );
};

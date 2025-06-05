import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { LockOpen } from 'lucide-react';

export const SidebarUpgrade: FC = () => {
  const router = useRouter();

  const handleUpgradeClick = () => {
    router.push('/upgrade');
  };

  return (
    <div className="mt-2">
      <div
        className="hover:bg-accent -mb-2 flex cursor-pointer flex-col items-start rounded px-1 py-2 hover:opacity-50"
        onClick={handleUpgradeClick}
      >
        <div className="flex items-center">
          <LockOpen className="mr-2" size={28} />
          <div className="flex flex-col">
            <div className="text-sm font-semibold">Upgrade plan</div>
            <div className="text-muted-foreground mt-1 text-xs">
              Upgrade for file upload, smarter AI, and more
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

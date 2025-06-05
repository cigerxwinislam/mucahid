import { PentestGPTContext } from '@/context/context';
import { cn } from '@/lib/utils';
import { PluginID } from '@/types/plugins';
import { SquareTerminal, Plus, Telescope } from 'lucide-react';
import { useContext, useState } from 'react';
import { WithTooltip } from '../../ui/with-tooltip';
import { useUIContext } from '@/context/ui-context';
import { UpgradePrompt, UpgradeModal } from './upgrade-modal';
import { PLUGINS_WITHOUT_IMAGE_SUPPORT } from '@/types/plugins';

interface ToolOptionsProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ToolOptions = ({ fileInputRef }: ToolOptionsProps) => {
  const TOOLTIP_DELAY = 500;
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<
    'deep research' | 'pentest agent'
  >('deep research');

  const { isPremiumSubscription, newMessageImages, isTemporaryChat } =
    useContext(PentestGPTContext);

  const { selectedPlugin, setSelectedPlugin, isMobile } = useUIContext();

  const hasImageAttached = newMessageImages.length > 0;

  const handleFileClick = () => {
    // Deselect all plugins when uploading files
    if (
      selectedPlugin &&
      PLUGINS_WITHOUT_IMAGE_SUPPORT.includes(selectedPlugin)
    ) {
      setSelectedPlugin(PluginID.NONE);
    }
    fileInputRef.current?.click();
  };

  const handlePentestAgentToggle = () => {
    if (!isPremiumSubscription) {
      setUpgradeFeature('pentest agent');
      setShowUpgradePrompt(true);
      return;
    }

    setSelectedPlugin(
      selectedPlugin === PluginID.PENTEST_AGENT
        ? PluginID.NONE
        : PluginID.PENTEST_AGENT,
    );
  };

  const handleResearchToggle = () => {
    if (hasImageAttached) return;

    if (!isPremiumSubscription) {
      setUpgradeFeature('deep research');
      setShowUpgradePrompt(true);
      return;
    }

    setSelectedPlugin(
      selectedPlugin === PluginID.DEEP_RESEARCH
        ? PluginID.NONE
        : PluginID.DEEP_RESEARCH,
    );
  };

  return (
    <div className="flex items-center space-x-1">
      {/* File Upload Button */}
      {!isTemporaryChat && (
        <WithTooltip
          delayDuration={TOOLTIP_DELAY}
          side="top"
          display={
            <div className="flex flex-col">
              {!isPremiumSubscription ? (
                <UpgradePrompt feature="file upload" />
              ) : (
                <p className="font-medium">Add photos and files</p>
              )}
            </div>
          }
          trigger={
            <div className="flex items-center" onClick={handleFileClick}>
              <Plus
                className={cn(
                  'cursor-pointer rounded-lg p-1 hover:bg-black/10 focus-visible:outline-black dark:hover:bg-white/10 dark:focus-visible:outline-white',
                  !isPremiumSubscription && 'opacity-50',
                )}
                size={32}
              />
            </div>
          }
        />
      )}

      {/* Terminal Tool - Only show if not in temporary chat */}
      {!isTemporaryChat && (
        <WithTooltip
          delayDuration={TOOLTIP_DELAY}
          side="top"
          display={
            <div className="flex flex-col">
              {!isPremiumSubscription ? (
                <UpgradePrompt feature="pentest agent" />
              ) : (
                <p className="font-medium">Use pentest agent</p>
              )}
            </div>
          }
          trigger={
            <div
              className={cn(
                'flex items-center rounded-lg transition-colors duration-300',
                selectedPlugin === PluginID.PENTEST_AGENT
                  ? 'bg-primary/10'
                  : 'hover:bg-black/10 dark:hover:bg-white/10',
                !isPremiumSubscription && 'opacity-50',
              )}
              onClick={handlePentestAgentToggle}
            >
              <SquareTerminal
                className={cn(
                  'cursor-pointer rounded-lg p-1 focus-visible:outline-black dark:focus-visible:outline-white',
                  selectedPlugin === PluginID.PENTEST_AGENT
                    ? 'text-primary'
                    : 'opacity-50',
                )}
                size={32}
              />
              <div
                className={cn(
                  'whitespace-nowrap text-xs font-medium transition-all duration-300',
                  'max-w-[100px] pr-2',
                  isMobile && selectedPlugin !== PluginID.PENTEST_AGENT
                    ? 'hidden'
                    : 'opacity-100',
                )}
              >
                {isMobile ? 'Agent' : 'Pentest Agent'}
              </div>
            </div>
          }
        />
      )}

      {/* Research Tool */}
      <WithTooltip
        delayDuration={TOOLTIP_DELAY}
        side="top"
        display={
          <div className="flex flex-col">
            {!isPremiumSubscription ? (
              <UpgradePrompt feature="deep research" />
            ) : hasImageAttached ? (
              <p className="font-medium">
                Deep Research doesn&apos;t support images
              </p>
            ) : (
              <p className="font-medium">Run deep research</p>
            )}
          </div>
        }
        trigger={
          <div
            className={cn(
              'flex items-center rounded-lg transition-colors duration-300',
              selectedPlugin === PluginID.DEEP_RESEARCH
                ? 'bg-primary/10'
                : 'hover:bg-black/10 dark:hover:bg-white/10',
              !isPremiumSubscription && 'opacity-50',
              hasImageAttached && 'opacity-50',
            )}
            onClick={handleResearchToggle}
          >
            <Telescope
              className={cn(
                'cursor-pointer rounded-lg p-1 focus-visible:outline-black dark:focus-visible:outline-white',
                selectedPlugin === PluginID.DEEP_RESEARCH
                  ? 'text-primary'
                  : 'opacity-50',
              )}
              size={32}
            />
            <div
              className={cn(
                'whitespace-nowrap text-xs font-medium transition-all duration-300',
                'max-w-[100px] pr-2',
                isMobile && selectedPlugin !== PluginID.DEEP_RESEARCH
                  ? 'hidden'
                  : 'opacity-100',
              )}
            >
              Research
            </div>
          </div>
        }
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={upgradeFeature}
      />
    </div>
  );
};

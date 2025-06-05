import type { FC } from 'react';
import { DialogPanel, DialogTitle } from '@headlessui/react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { TransitionedDialog } from '../ui/transitioned-dialog';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  isLoading?: boolean;
}

export const DeleteDialog: FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Delete',
  isLoading = false,
}) => {
  return (
    <TransitionedDialog isOpen={isOpen} onClose={onClose}>
      <DialogPanel className="bg-popover w-full max-w-md overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
        <DialogTitle
          as="h3"
          className="text-center text-lg font-medium leading-6"
        >
          {title}
        </DialogTitle>
        <div className="mt-2">
          <p className="text-center text-sm">{message}</p>
        </div>

        <div className="mt-4 flex justify-center space-x-4">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className={`transition-opacity duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isLoading ? 'opacity-75 cursor-not-allowed' : 'opacity-100'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              confirmButtonText
            )}
          </Button>
        </div>
      </DialogPanel>
    </TransitionedDialog>
  );
};

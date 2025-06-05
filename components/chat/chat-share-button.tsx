// import { Button } from '@/components/ui/button';
// import { CopyButton } from '@/components/ui/copy-button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { PentestGPTContext } from '@/context/context';
// import { getLastSharedMessageId, updateChat } from '@/db/chats';
// import { getMessagesByChatId } from '@/db/messages';
// import type { Doc } from '@/convex/_generated/dataModel';
// import {
//   IconBrandFacebook,
//   IconBrandLinkedin,
//   IconBrandReddit,
//   IconBrandX,
//   IconLink,
// } from '@tabler/icons-react';
// import { X, Share } from 'lucide-react';
// import React, { useContext, useEffect, useState } from 'react';
// import { toast } from 'sonner';
// import { WithTooltip } from '../ui/with-tooltip';

// interface ShareChatButtonProps {
//   children?: React.ReactNode;
//   chat?: Doc<'chats'>;
//   variant?: 'default' | 'chatUI';
// }

// export const ShareChatButton: React.FC<ShareChatButtonProps> = ({
//   children,
//   chat,
//   variant = 'default',
// }) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [shareUrl, setShareUrl] = useState('');
//   const { profile, selectedChat } = useContext(PentestGPTContext);

//   const chatToShare = chat || selectedChat;

//   useEffect(() => {
//     if (isDialogOpen) {
//       checkIfShared();
//     }
//   }, [isDialogOpen, chatToShare]);

//   const checkIfShared = async () => {
//     if (!chatToShare) return;

//     const lastSharedMessageId = await getLastSharedMessageId(chatToShare.id);

//     if (lastSharedMessageId) {
//       setShareUrl(`${window.location.origin}/share/${lastSharedMessageId}`);
//     } else {
//       setShareUrl('');
//     }
//   };

//   const handleShareChat = async () => {
//     if (!chatToShare || !profile?.user_id) return;

//     try {
//       setIsLoading(true);

//       const messages = await getMessagesByChatId(chatToShare.id);

//       if (messages.length === 0) {
//         setIsLoading(false);
//         return;
//       }

//       const lastMessage = messages[messages.length - 1];

//       await updateChat(chatToShare.id, {
//         sharing: 'public',
//         last_shared_message_id: lastMessage.id,
//         shared_by: profile.user_id,
//         shared_at: Date.now(),
//       });

//       setShareUrl(`${window.location.origin}/share/${lastMessage.id}`);
//       setIsLoading(false);
//     } catch (error) {
//       toast.error('Error sharing chat');
//       console.error('Error sharing chat:', error);
//       setIsLoading(false);
//     }
//   };

//   const handleSocialShare = (platform: string) => {
//     let url = '';
//     const text = 'Check out this chat!';

//     switch (platform) {
//       case 'linkedin':
//         url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
//         break;
//       case 'facebook':
//         url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
//         break;
//       case 'reddit':
//         url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`;
//         break;
//       case 'twitter':
//         url = `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
//         break;
//     }

//     window.open(url, '_blank');
//   };

//   const handleOpenDialog = async () => {
//     setIsDialogOpen(true);
//     await checkIfShared();
//   };

//   if (!chatToShare) return null;

//   if (variant === 'chatUI') {
//     return (
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogTrigger asChild>
//           <Button
//             onClick={handleOpenDialog}
//             variant="secondary"
//             className="border-secondary-foreground relative rounded-full border px-4"
//             size="sm"
//             aria-label="Share"
//           >
//             <div className="flex w-full items-center justify-center gap-1.5">
//               <Share size={16} />
//               <span className="font-normal">Share</span>
//             </div>
//           </Button>
//         </DialogTrigger>
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle>
//               {shareUrl ? 'Update' : 'Create'} public link
//             </DialogTitle>
//             <Button
//               size="icon"
//               variant="ghost"
//               onClick={() => setIsDialogOpen(false)}
//               className="absolute right-4 top-4"
//             >
//               <X className="size-4" />
//             </Button>
//           </DialogHeader>
//           <div className="flex flex-col space-y-4">
//             <p className="text-sm text-gray-500">
//               {shareUrl
//                 ? 'The public link to your chat has been updated.'
//                 : 'Generate a public link to share your chat.'}
//             </p>
//             <div className="flex items-center space-x-2">
//               {shareUrl && <Input value={shareUrl} readOnly className="grow" />}
//               <Button
//                 loading={isLoading}
//                 variant="outline"
//                 onClick={handleShareChat}
//               >
//                 <IconLink className="mr-2 size-4" />
//                 {shareUrl ? 'Update' : 'Generate'} link
//               </Button>
//               {shareUrl && (
//                 <CopyButton
//                   variant={'outline'}
//                   className={'text-foreground size-10 shrink-0'}
//                   value={shareUrl}
//                 />
//               )}
//             </div>
//             {shareUrl && (
//               <div className="flex justify-center space-x-4">
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   onClick={() => handleSocialShare('linkedin')}
//                 >
//                   <IconBrandLinkedin className="size-4" />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   onClick={() => handleSocialShare('facebook')}
//                 >
//                   <IconBrandFacebook className="size-4" />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   onClick={() => handleSocialShare('reddit')}
//                 >
//                   <IconBrandReddit className="size-4" />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   onClick={() => handleSocialShare('twitter')}
//                 >
//                   <IconBrandX className="size-4" />
//                 </Button>
//               </div>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     );
//   }

//   return (
//     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//       <DialogTrigger asChild>
//         {children ? (
//           <div onClick={handleOpenDialog}>{children}</div>
//         ) : (
//           <WithTooltip
//             delayDuration={200}
//             display={'Share'}
//             trigger={
//               <Share
//                 className="mr-2 cursor-pointer hover:opacity-50"
//                 size={24}
//                 strokeWidth={2}
//                 onClick={handleOpenDialog}
//               />
//             }
//             side="bottomRight"
//           />
//         )}
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>
//             {shareUrl ? 'Update' : 'Create'} public link
//           </DialogTitle>
//           <Button
//             size="icon"
//             variant="ghost"
//             onClick={() => setIsDialogOpen(false)}
//             className="absolute right-4 top-4"
//           >
//             <X className="size-4" />
//           </Button>
//         </DialogHeader>
//         <div className="flex flex-col space-y-4">
//           <p className="text-sm text-gray-500">
//             {shareUrl
//               ? 'The public link to your chat has been updated.'
//               : 'Generate a public link to share your chat.'}
//           </p>
//           <div className="flex items-center space-x-2">
//             {shareUrl && <Input value={shareUrl} readOnly className="grow" />}
//             <Button
//               loading={isLoading}
//               variant="outline"
//               onClick={handleShareChat}
//             >
//               <IconLink className="mr-2 size-4" />
//               {shareUrl ? 'Update' : 'Generate'} link
//             </Button>
//             {shareUrl && (
//               <CopyButton
//                 variant={'outline'}
//                 className={'text-foreground size-10 shrink-0'}
//                 value={shareUrl}
//               />
//             )}
//           </div>
//           {shareUrl && (
//             <div className="flex justify-center space-x-4">
//               <Button
//                 size="icon"
//                 variant="outline"
//                 onClick={() => handleSocialShare('linkedin')}
//               >
//                 <IconBrandLinkedin className="size-4" />
//               </Button>
//               <Button
//                 size="icon"
//                 variant="outline"
//                 onClick={() => handleSocialShare('facebook')}
//               >
//                 <IconBrandFacebook className="size-4" />
//               </Button>
//               <Button
//                 size="icon"
//                 variant="outline"
//                 onClick={() => handleSocialShare('reddit')}
//               >
//                 <IconBrandReddit className="size-4" />
//               </Button>
//               <Button
//                 size="icon"
//                 variant="outline"
//                 onClick={() => handleSocialShare('twitter')}
//               >
//                 <IconBrandX className="size-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

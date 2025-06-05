import { PentestGPTContext } from '@/context/context';
import { cn } from '@/lib/utils';
import type { ContentType, DataItemType, DataListType } from '@/types';
import {
  type FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChatItem } from './items/chat/chat-item';
import { getChatsByUserId } from '@/db/chats';
import { Loader2 } from 'lucide-react';
import { type DateCategory, sortByDateCategory } from '@/lib/utils';
import type { Doc } from '@/convex/_generated/dataModel';

interface SidebarDataListProps {
  contentType: ContentType;
  data: DataListType;
}

export const SidebarDataList: FC<SidebarDataListProps> = ({
  contentType,
  data,
}) => {
  const {
    setChats,
    isTemporaryChat,
    chatsCursor,
    setChatsCursor,
    chatsIsDone,
    setChatsIsDone,
  } = useContext(PentestGPTContext);

  const divRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchMoreChats = useCallback(async () => {
    if (
      contentType === 'chats' &&
      data.length > 0 &&
      !isLoadingMore &&
      !isFetchingRef.current &&
      !chatsIsDone
    ) {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      const lastChat = data[data.length - 1] as Doc<'chats'>;

      try {
        // Disconnect observer while fetching to prevent multiple triggers
        if (observerRef.current && loaderRef.current) {
          observerRef.current.unobserve(loaderRef.current);
        }

        const result = await getChatsByUserId(
          lastChat.user_id,
          25,
          chatsCursor,
        );

        if (result.chats.length > 0) {
          setChats((prevChats) => {
            // Create a map of existing chats by ID for quick lookup
            const existingChatsMap = new Map(
              prevChats.map((chat) => [chat.id, chat]),
            );

            // Filter out any chats that already exist in prevChats
            const uniqueNewChats = result.chats.filter(
              (chat) => !existingChatsMap.has(chat.id),
            );

            // Return combined array with unique chats
            return [...prevChats, ...uniqueNewChats];
          });

          setChatsCursor(result.continueCursor);
          setChatsIsDone(result.isDone);
        } else {
          setChatsIsDone(true);
        }
      } catch (error) {
        console.error('Error fetching more chats:', error);
        setChatsIsDone(true);
      } finally {
        isFetchingRef.current = false;
        setIsLoadingMore(false);

        // Reconnect observer after fetch completes
        if (observerRef.current && loaderRef.current && !chatsIsDone) {
          observerRef.current.observe(loaderRef.current);
        }
      }
    }
  }, [
    contentType,
    data,
    isLoadingMore,
    chatsIsDone,
    setChats,
    chatsCursor,
    setChatsCursor,
    setChatsIsDone,
  ]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px', // Add some margin to start loading before reaching the end
      threshold: 0.1, // Trigger when at least 10% of the element is visible
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        !isLoadingMore &&
        !isFetchingRef.current &&
        !chatsIsDone
      ) {
        fetchMoreChats();
      }
    }, options);

    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loaderRef, isLoadingMore, chatsIsDone, fetchMoreChats]);

  const getDataListComponent = (
    contentType: ContentType,
    item: DataItemType,
  ) => {
    switch (contentType) {
      case 'chats':
        return <ChatItem key={item.id} chat={item as Doc<'chats'>} />;
      default:
        return null;
    }
  };

  const getSortedData = (data: DataItemType[], category: DateCategory) => {
    return sortByDateCategory(data, category);
  };

  return (
    <div
      ref={divRef}
      className={cn(
        'relative flex h-full flex-col',
        isTemporaryChat ? 'overflow-hidden' : 'overflow-auto',
      )}
    >
      {isTemporaryChat && (
        <div className="bg-tertiary/80 pointer-events-auto absolute inset-0 z-50" />
      )}
      <div
        className={cn(
          'relative z-10',
          isTemporaryChat && 'pointer-events-none',
        )}
      >
        {data.length === 0 && (
          <div className="flex grow flex-col items-center justify-center">
            <div className="text-muted-foreground p-8 text-center text-lg italic">
              No {contentType}.
            </div>
          </div>
        )}

        {data.length > 0 && (
          <div className={`size-full space-y-3 pt-4`}>
            {contentType === 'chats' ? (
              <>
                {[
                  'Today',
                  'Yesterday',
                  'Previous 7 Days',
                  'Previous 30 Days',
                  'Older',
                ].map((dateCategory) => {
                  const sortedData = getSortedData(
                    data,
                    dateCategory as
                      | 'Today'
                      | 'Yesterday'
                      | 'Previous 7 Days'
                      | 'Previous 30 Days'
                      | 'Older',
                  );

                  return (
                    sortedData.length > 0 && (
                      <div key={dateCategory} className="pb-2">
                        <div className="text-muted-foreground bg-tertiary sticky top-0 z-10 mb-1 py-1 pl-2 text-xs font-bold">
                          {dateCategory}
                        </div>

                        <div className={cn('flex grow flex-col')}>
                          {sortedData.map((item: any) => (
                            <div key={item.id}>
                              {getDataListComponent(contentType, item)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })}
                {contentType === 'chats' &&
                  data.length > 0 &&
                  !chatsIsDone &&
                  !isTemporaryChat && (
                    <div ref={loaderRef} className="mt-4 flex justify-center">
                      {isLoadingMore && (
                        <Loader2 className="text-primary size-4 animate-spin" />
                      )}
                    </div>
                  )}
              </>
            ) : (
              <div className={cn('flex grow flex-col')}>
                {data.map((item) => (
                  <div key={item.id}>
                    {getDataListComponent(contentType, item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

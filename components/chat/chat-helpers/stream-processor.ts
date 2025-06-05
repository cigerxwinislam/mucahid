import type { ChatMessage, DataPartValue, FileAttachment } from '@/types';
import type { AlertAction } from '@/context/alert-context';
import { processDataStream } from 'ai';
import { toast } from 'sonner';
import { PluginID } from '@/types/plugins';
import type { AgentStatusState } from '@/components/messages/agent-status';
import type { Dispatch, SetStateAction } from 'react';
import { fetchChatResponse } from '.';

export const processResponse = async (
  response: Response,
  lastChatMessage: ChatMessage,
  controller: AbortController,
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>,
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setToolInUse: Dispatch<SetStateAction<string>>,
  setIsGenerating: Dispatch<SetStateAction<boolean>>,
  alertDispatch: Dispatch<AlertAction>,
  selectedPlugin: PluginID,
  isContinuation: boolean,
  setAgentStatus: Dispatch<SetStateAction<AgentStatusState | null>>,
  requestBody: any,
) => {
  if (!response.ok) {
    const result = await response.json();
    let errorMessage = result.error?.message || 'An unknown error occurred';

    switch (response.status) {
      case 400:
        errorMessage = `Bad Request: ${errorMessage}`;
        break;
      case 401:
        errorMessage = `Invalid Credentials: ${errorMessage}`;
        break;
      case 402:
        errorMessage = `Out of Credits: ${errorMessage}`;
        break;
      case 403:
        errorMessage = `Moderation Required: ${errorMessage}`;
        break;
      case 408:
        errorMessage = `Request Timeout: ${errorMessage}`;
        break;
      case 429:
        errorMessage = `Rate Limited: ${errorMessage}`;
        break;
      case 502:
        errorMessage = `Service Unavailable: ${errorMessage}`;
        break;
      default:
        errorMessage = `HTTP Error: ${errorMessage}`;
    }

    throw new Error(errorMessage);
  }

  if (response.body) {
    let fullText = '';
    let thinkingText = '';
    let finishReason = '';
    let thinkingElapsedSecs: number | null = null;
    let isFirstChunk = true;
    let isFirstChunkReceived = false;
    let updatedPlugin = selectedPlugin;
    let toolExecuted = false;
    let citations: string[] = [];
    let shouldSkipFirstChunk = false;
    let chatTitle: string | null = null;
    let fileAttachments: FileAttachment[] = [];
    let assistantMessageId: string | null = null;

    try {
      await processDataStream({
        stream: response.body,
        onTextPart: (value) => {
          if (value && !controller.signal.aborted) {
            // Check if this is the first chunk and matches the last message
            if (isFirstChunk) {
              isFirstChunkReceived = true;
              if (
                isContinuation &&
                lastChatMessage?.message?.content === value
              ) {
                shouldSkipFirstChunk = true;
                isFirstChunk = false;
                return;
              }
              setFirstTokenReceived(true);
              isFirstChunk = false;
            }

            // Skip if this was a duplicate first chunk
            if (shouldSkipFirstChunk) {
              shouldSkipFirstChunk = false;
              return;
            }

            fullText += value;

            setChatMessages((prev) =>
              prev.map((chatMessage) =>
                chatMessage.message.id === lastChatMessage.message.id
                  ? {
                      ...chatMessage,
                      message: {
                        ...chatMessage.message,
                        content: chatMessage.message.content + value,
                      },
                    }
                  : chatMessage,
              ),
            );
          }
        },
        onDataPart: (value) => {
          if (
            Array.isArray(value) &&
            value.length > 0 &&
            !controller.signal.aborted
          ) {
            const firstValue = value[0] as DataPartValue;

            if (firstValue.type) {
              if (firstValue.type === 'text-delta') {
                // Check if this is the first chunk and matches the last message
                if (isFirstChunk) {
                  isFirstChunkReceived = true;
                  if (
                    isContinuation &&
                    lastChatMessage?.message?.content === firstValue.content
                  ) {
                    shouldSkipFirstChunk = true;
                    isFirstChunk = false;
                    return;
                  }
                  setFirstTokenReceived(true);
                  isFirstChunk = false;
                }

                // Skip if this was a duplicate first chunk
                if (shouldSkipFirstChunk) {
                  shouldSkipFirstChunk = false;
                  return;
                }

                fullText += firstValue.content;

                setChatMessages((prev) =>
                  prev.map((chatMessage) =>
                    chatMessage.message.id === lastChatMessage.message.id
                      ? {
                          ...chatMessage,
                          message: {
                            ...chatMessage.message,
                            content:
                              chatMessage.message.content + firstValue.content,
                          },
                        }
                      : chatMessage,
                  ),
                );
              }

              if (firstValue.type === 'file-attachment') {
                const attachments = Array.isArray(firstValue.content)
                  ? (firstValue.content as FileAttachment[])
                  : [];
                fileAttachments = [...fileAttachments, ...attachments];
              }

              if (firstValue.type === 'agent-status') {
                setAgentStatus(firstValue.content as AgentStatusState);
              }

              if (firstValue.type === 'reasoning') {
                if (isFirstChunk) {
                  setFirstTokenReceived(true);
                  isFirstChunk = false;
                }

                thinkingText += firstValue.content;

                setChatMessages((prev) =>
                  prev.map((chatMessage) =>
                    chatMessage.message.id === lastChatMessage.message.id
                      ? {
                          ...chatMessage,
                          message: {
                            ...chatMessage.message,
                            thinking_content: thinkingText,
                          },
                        }
                      : chatMessage,
                  ),
                );
              }

              // Handle thinking time
              if (
                firstValue.type === 'thinking-time' &&
                firstValue.elapsed_secs
              ) {
                thinkingElapsedSecs = firstValue.elapsed_secs;
                setChatMessages((prev) =>
                  prev.map((chatMessage) =>
                    chatMessage.message.id === lastChatMessage.message.id
                      ? {
                          ...chatMessage,
                          message: {
                            ...chatMessage.message,
                            thinking_elapsed_secs:
                              thinkingElapsedSecs || undefined,
                          },
                        }
                      : chatMessage,
                  ),
                );
              }

              // Handle tools errors
              if (firstValue.type === 'error') {
                const errorMessage =
                  firstValue.content || 'An unknown error occurred';

                if (errorMessage.includes('reached the limit')) {
                  alertDispatch({
                    type: 'SHOW',
                    payload: {
                      message: errorMessage,
                      title: 'Usage Cap Error',
                    },
                  });
                } else {
                  toast.error(errorMessage);
                }

                setIsGenerating(false);
                controller.abort();
                return;
              }
            }

            // Handle citations
            if (firstValue?.citations) {
              citations = firstValue.citations;
            }

            // Handle chatTitle
            if (firstValue?.chatTitle) {
              chatTitle = firstValue.chatTitle;
            }

            if (firstValue?.messageId) {
              assistantMessageId = firstValue.messageId;
            }

            // Handle finishReason
            if (firstValue?.finishReason) {
              if (firstValue.finishReason === 'tool-calls') {
                finishReason = 'terminal-calls';
              } else {
                finishReason = firstValue.finishReason;
              }
            }
          }
        },
        onToolCallPart: async (value) => {
          if (toolExecuted || controller.signal.aborted) return;

          const { toolName } = value;
          const toolMap = {
            browser: PluginID.BROWSER,
            terminal: PluginID.PENTEST_AGENT,
            webSearch: PluginID.WEB_SEARCH,
          } as const;

          const plugin = toolMap[toolName as keyof typeof toolMap];
          if (plugin) {
            setToolInUse(plugin);
            updatedPlugin = plugin;
          }

          if (plugin === PluginID.PENTEST_AGENT) {
            const apiEndpoint = '/api/agent';

            const agentResponse = await fetchChatResponse(
              apiEndpoint,
              requestBody,
              controller,
              setIsGenerating,
              setChatMessages,
              alertDispatch,
              false,
            );

            const result = await processResponse(
              agentResponse,
              lastChatMessage,
              controller,
              setFirstTokenReceived,
              setChatMessages,
              setToolInUse,
              setIsGenerating,
              alertDispatch,
              PluginID.PENTEST_AGENT,
              false,
              setAgentStatus,
              requestBody,
            );

            if (result) {
              fullText = result.fullText;
              thinkingText = result.thinkingText;
              thinkingElapsedSecs = result.thinkingElapsedSecs;
              finishReason = result.finishReason;
              citations = result.citations;
              chatTitle = result.chatTitle;
              fileAttachments = result.fileAttachments;
            }
          }

          toolExecuted = true;
        },
        onStartStepPart: (value) => {
          if (value.messageId) {
            assistantMessageId = value.messageId;
          }
        },
        onReasoningPart: (value) => {
          if (isFirstChunk) {
            setFirstTokenReceived(true);
            isFirstChunk = false;
          }

          thinkingText += value;

          setChatMessages((prev) =>
            prev.map((chatMessage) =>
              chatMessage.message.id === lastChatMessage.message.id
                ? {
                    ...chatMessage,
                    message: {
                      ...chatMessage.message,
                      thinking_content: thinkingText,
                    },
                  }
                : chatMessage,
            ),
          );
        },
        onFinishMessagePart: (value) => {
          if (finishReason === '' && !controller.signal.aborted) {
            // Only set finishReason if it hasn't been set before
            if (
              value.finishReason === 'tool-calls' &&
              updatedPlugin === PluginID.PENTEST_AGENT
            ) {
              // To use continue generating for terminal
              finishReason = 'terminal-calls';
            } else if (
              value.finishReason === 'length' &&
              !isFirstChunkReceived &&
              isContinuation
            ) {
              finishReason = 'stop';
            } else {
              finishReason = value.finishReason;
            }
          }
        },
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Unexpected error processing stream:', error);
      }
    }

    return {
      fullText,
      thinkingText,
      thinkingElapsedSecs,
      finishReason,
      selectedPlugin: updatedPlugin,
      citations,
      chatTitle,
      fileAttachments,
      assistantMessageId,
    };
  } else {
    throw new Error('Response body is null');
  }
};

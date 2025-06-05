import type { Doc } from '@/convex/_generated/dataModel';
import { PluginID } from '@/types/plugins';
import type { FC } from 'react';
import { MessageMarkdown } from './message-markdown';
import { MessageTerminal } from './terminal-messages/message-terminal';
import { MessageCitations } from './message-citations';
import { MessageThinking } from './message-thinking';

interface MessageTypeResolverProps {
  message: Doc<'messages'>;
  isLastMessage: boolean;
  toolInUse: string;
}

export const allTerminalPlugins = [PluginID.TERMINAL, PluginID.PENTEST_AGENT];

export const MessageTypeResolver: FC<MessageTypeResolverProps> = ({
  message,
  isLastMessage,
  toolInUse,
}) => {
  const isPluginOutput =
    message.plugin !== null &&
    message.plugin !== PluginID.NONE.toString() &&
    message.role === 'assistant';

  // console.log({
  //   isPluginOutput,
  //   plugin: message.plugin,
  //   role: message.role
  // })

  if (
    (isPluginOutput &&
      allTerminalPlugins.includes(message.plugin as PluginID)) ||
    allTerminalPlugins.includes(toolInUse as PluginID)
  ) {
    return (
      <MessageTerminal
        content={message.content}
        isAssistant={message.role === 'assistant'}
        isLastMessage={isLastMessage}
      />
    );
  }

  if (message.role === 'assistant' && message.thinking_content) {
    return (
      <MessageThinking
        content={message.content}
        thinking_content={message.thinking_content}
        thinking_elapsed_secs={message.thinking_elapsed_secs}
        isAssistant={message.role === 'assistant'}
        citations={message.citations || []}
      />
    );
  }

  if (
    message.role === 'assistant' &&
    (message.plugin === PluginID.WEB_SEARCH ||
      toolInUse === PluginID.WEB_SEARCH ||
      message.citations?.length > 0)
  ) {
    return (
      <MessageCitations
        content={message.content}
        isAssistant={message.role === 'assistant'}
        citations={message.citations || []}
      />
    );
  }

  return (
    <MessageMarkdown
      content={message.content}
      isAssistant={message.role === 'assistant'}
    />
  );
};

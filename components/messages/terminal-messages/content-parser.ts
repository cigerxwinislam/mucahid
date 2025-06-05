import type { ContentBlock } from './types';

export const parseContent = (content: string): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  const blockRegex =
    /((?:<terminal-command[^>]*>[\s\S]*?<\/terminal-command>|```terminal\n[\s\S]*?```|<file-content[^>]*>[\s\S]*?<\/file-content>|<file-read[^>]*>[\s\S]*?<\/file-read>|<file-write[^>]*>[\s\S]*?<\/file-write>|<file-str-replace[^>]*>[\s\S]*?<\/file-str-replace>|<shell-wait[^>]*>[\s\S]*?<\/shell-wait>|<info_search_web[^>]*>[\s\S]*?<\/info_search_web>|<pgptml:[^>]*>[\s\S]*?<\/pgptml:[^>]*>)(?:\n```(?:stdout)[\s\S]*?(?:```|$))*(?:\s*<terminal-error>[\s\S]*?<\/terminal-error>)?)/g;
  const terminalXmlRegex =
    /<(?:terminal-command|pgptml:terminal_command)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:terminal-command|pgptml:terminal_command)>/;
  const terminalMarkdownRegex = /```terminal\n([\s\S]*?)```/;
  // For file-read tool (both old and new format)
  const fileReadRegex =
    /<(?:file-read|pgptml:file_read)(?:\s+path="([^"]*)")?>([\s\S]*?)<\/(?:file-read|pgptml:file_read)>/;
  // For file-read tool (old format)
  const fileContentRegex =
    /<file-content(?:\s+path="([^"]*)")?>([\s\S]*?)<\/file-content>/;
  // For file-write tool (both old and new format)
  const fileWriteRegex =
    /<(?:file-write|pgptml:file_write)(?:\s+file="([^"]*)"|\s+path="([^"]*)")(?:\s+mode="([^"]*)")?>([\s\S]*?)<\/(?:file-write|pgptml:file_write)>/;
  // For file-str-replace tool (both old and new format)
  const fileStrReplaceRegex =
    /<(?:file-str-replace|pgptml:file_str_replace)(?:\s+file="([^"]*)")?>([\s\S]*?)<\/(?:file-str-replace|pgptml:file_str_replace)>/;
  // For shell-wait tool (both old and new format)
  const shellWaitRegex =
    /<(?:shell-wait|pgptml:shell_wait)[^>]*>([\s\S]*?)<\/(?:shell-wait|pgptml:shell_wait)>/;
  // For info-search-web tool (both old and new format)
  const infoSearchWebRegex =
    /<(?:info_search_web|pgptml:info_search_web)(?:\s+query="([^"]*)")?[^>]*>([\s\S]*?)<\/(?:info_search_web|pgptml:info_search_web)>/;
  const stdoutRegex = /```stdout\n([\s\S]*?)(?:```|$)/;
  const errorRegex = /<terminal-error>([\s\S]*?)<\/terminal-error>/;
  const execDirRegex = /exec-dir="([^"]*)"/;

  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: content.slice(lastIndex, match.index).trim(),
      });
    }

    const block = match[1];
    const terminalXmlMatch = block.match(terminalXmlRegex);
    const terminalMarkdownMatch = block.match(terminalMarkdownRegex);
    const fileContentMatch = block.match(fileContentRegex);
    const fileReadMatch = block.match(fileReadRegex);
    const fileWriteMatch = block.match(fileWriteRegex);
    const fileStrReplaceMatch = block.match(fileStrReplaceRegex);
    const shellWaitMatch = block.match(shellWaitRegex);
    const infoSearchWebMatch = block.match(infoSearchWebRegex);
    const stdoutMatch = block.match(stdoutRegex);
    const errorMatch = block.match(errorRegex);
    const execDirMatch = terminalXmlMatch ? block.match(execDirRegex) : null;

    if (shellWaitMatch) {
      blocks.push({
        type: 'shell-wait',
        content: {
          seconds: shellWaitMatch[1].trim(),
        },
      });
    } else if (infoSearchWebMatch) {
      const query = infoSearchWebMatch[1] || '';
      const searchResults = JSON.parse(infoSearchWebMatch[2]);
      blocks.push({
        type: 'info-search-web',
        content: {
          query,
          results: searchResults,
        },
      });
    } else if (terminalXmlMatch || terminalMarkdownMatch) {
      blocks.push({
        type: 'terminal',
        content: {
          command: (
            terminalXmlMatch?.[1] ||
            terminalMarkdownMatch?.[1] ||
            ''
          ).trim(),
          stdout: stdoutMatch ? stdoutMatch[1].trim() : '',
          error: errorMatch ? errorMatch[1].trim() : undefined,
          exec_dir: execDirMatch ? execDirMatch[1] : undefined,
        },
      });
    } else if (fileContentMatch) {
      blocks.push({
        type: 'file-content',
        content: {
          path: fileContentMatch[1] || '',
          content: fileContentMatch[2].trim(),
          mode: 'read',
        },
      });
    } else if (fileReadMatch) {
      blocks.push({
        type: 'file-content',
        content: {
          path: fileReadMatch?.[1] || '',
          content: fileReadMatch?.[2].trim(),
          mode: 'read',
        },
      });
    } else if (fileWriteMatch) {
      const path = fileWriteMatch[1] || fileWriteMatch[2] || '';
      const content = fileWriteMatch[4]?.trim() || '';
      const mode = fileWriteMatch[3] as 'create' | 'append' | 'overwrite';

      blocks.push({
        type: 'file-content',
        content: {
          path,
          content,
          mode: mode || 'overwrite',
        },
      });
    } else if (fileStrReplaceMatch) {
      blocks.push({
        type: 'file-content',
        content: {
          path: fileStrReplaceMatch[1] || '',
          content: fileStrReplaceMatch[2].trim(),
          mode: 'overwrite',
        },
      });
    }

    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex).trim() });
  }

  return blocks;
};

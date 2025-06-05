import type { JSX } from 'react';
import { codeToHast } from 'shiki';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import type { AgentCodeBlockLang } from '@/types';

// Theme constants for light and dark modes
export const CODE_THEMES = {
  light: 'github-light',
  dark: 'github-dark',
} as const;

interface HighlightOptions {
  lang: AgentCodeBlockLang;
  theme?: string;
  customComponents?: {
    pre?: (props: any) => JSX.Element;
    code?: (props: any) => JSX.Element;
  };
}

export async function highlight(code: string, options: HighlightOptions) {
  const { lang, theme = CODE_THEMES.dark, customComponents } = options;

  const out = await codeToHast(code, {
    lang,
    theme,
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: customComponents,
  }) as JSX.Element;
}

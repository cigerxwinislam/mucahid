export interface ChatStarter {
  title: string;
  description: string;
  chatMessage: string;
}

export interface PluginSummary {
  id: number;
  name: string;
  categories: string[];
  value: PluginID;
  icon?: string;
  invertInDarkMode?: boolean;
  description?: string;
  githubRepoUrl?: string;
  isInstalled: boolean;
  isPremium: boolean;
  createdAt: string;
  starters: ChatStarter[];
}

export interface Plugin {
  id: PluginID;
}

export enum PluginID {
  NONE = 'none',
  PLUGINS_STORE = 'pluginselector',
  // Tools
  WEB_SEARCH = 'websearch',
  BROWSER = 'browser',
  TERMINAL = 'terminal',
  PENTEST_AGENT = 'pentest-agent',
  DEEP_RESEARCH = 'deep-research',
}

export const Plugins: Record<PluginID, Plugin> = Object.fromEntries(
  Object.values(PluginID).map((id) => [id, { id }]),
) as Record<PluginID, Plugin>;

export const PluginList = Object.values(Plugins);

type PluginUrls = Record<string, string>;

export const pluginUrls: PluginUrls = {
  PENTESTGPT: 'https://github.com/hackerai-tech/PentestGPT',
};

export const PLUGINS_WITHOUT_IMAGE_SUPPORT: PluginID[] = [
  PluginID.DEEP_RESEARCH,
];

export const isPluginWithoutImageSupport = (pluginId: PluginID): boolean => {
  return PLUGINS_WITHOUT_IMAGE_SUPPORT.includes(pluginId);
};

import { PluginID, pluginUrls, type PluginSummary } from '@/types/plugins';

export const availablePlugins: PluginSummary[] = [
  {
    id: 0,
    name: 'Standard Chat',
    value: PluginID.NONE,
    categories: [],
    isInstalled: false,
    isPremium: false,
    createdAt: '2023-01-01',
    starters: [],
  },
  {
    id: 2,
    name: 'Pentest Agent',
    value: PluginID.PENTEST_AGENT,
    categories: ['utils'],
    icon: 'https://cdn-icons-png.flaticon.com/128/5576/5576886.png',
    invertInDarkMode: true,
    description:
      'Run security scans, analyze vulnerabilities, and automate penetration testing tasks with AI assistance',
    githubRepoUrl: pluginUrls.PENTESTGPT,
    isInstalled: false,
    isPremium: true,
    createdAt: '2024-10-04',
    starters: [],
  },
];

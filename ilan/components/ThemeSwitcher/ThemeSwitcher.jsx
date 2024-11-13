import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import styles from './ThemeSwitcher.module.css';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const onChange = useCallback(
    (e) => {
      setTheme(e.currentTarget.value);
    },
    [setTheme]
  );
  return (
    <select value={theme} onChange={onChange} className={styles.select}>
      <option value="system">Pergal</option>
      <option value="dark">Reş</option>
      <option value="light">Spî</option>
    </select>
  );
};

export default ThemeSwitcher;

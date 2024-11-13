



import { Text, TextLink } from '@/components/Text';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import styles from './Footer.module.css';
import Spacer from './Spacer';
import Wrapper from './Wrapper';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Wrapper>
        <Text color="accents-7">
          Bi Amadekarîya{' '}
          <TextLink href="https://yekazadsoftwarecenter.vercel.app/" color="link">
            Yekazad Software Center
          </TextLink>
          ê |..
          <span> </span>Ji kerema xwe re tenê bi kurdî û dûrî neteweperwerîyê ye binivîsin...|
        </Text>
        <Spacer size={1} axis="vertical" />
        <ThemeSwitcher />
      </Wrapper>
    </footer>
  );
};

export default Footer;

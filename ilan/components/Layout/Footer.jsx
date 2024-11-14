



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
       
       İnşaat ve diğer İş ilanları   {' '}
          Her türlü işiniz için 
          <TextLink href="https://yekazadsoftwarecenter.vercel.app/" color="link">
            
            powered by
          </TextLink>
          <span> </span>|
        </Text>
        <Spacer size={1} axis="vertical" />
        <ThemeSwitcher />
      </Wrapper>
    </footer>
  );
};

export default Footer;

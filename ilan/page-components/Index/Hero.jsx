import { ButtonLink } from '@/components/Button';
import { Container, Spacer, Wrapper } from '@/components/Layout';
import Link from 'next/link';
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <Wrapper>
      <div>
        <a>Arabalar</a>
        <a>İş ilanlary</a>
        <a>Atölye</a>
        <a>Emlak</a>
        <a>Diğer</a>
        <Container justifyContent="center" className={styles.buttons}>
          <Container>
            <Link passHref href="/feed">
              <ButtonLink className={styles.button}>ilanlara bak</ButtonLink>
            </Link>
          </Container>
          <Spacer axis="horizontal" size={1} />
          <Container>
            <ButtonLink
              href="https://yekazadsoftwarecenter.vercel.app"
              type="secondary"
              className={styles.button}
            >
              Kullanım Koşulları
            </ButtonLink>
          </Container>
        </Container>
        <p className={styles.subtitle}>
        </p>

  Her türlü iş ilanı
      </div>
    </Wrapper>
  );
};

export default Hero;

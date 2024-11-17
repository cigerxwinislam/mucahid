import { ButtonLink } from '@/components/Button';
import { Container, Spacer, Wrapper } from '@/components/Layout';
import { Text } from '@/components/Text';
import Link from 'next/link';
import styles from './VerifyEmail.module.css';

export const VerifyEmail = ({ valid }) => {
  return (
    <Wrapper className={styles.root}>
      <Container column alignItems="center">
        <Text
          className={styles.text}
          color={valid ? 'success-light' : 'secondary'}
        >
          {valid
            ? 'Emailiniz doğrulanmıştır.'
            : 'Bu link boş, yeniden deneyin .'}
        </Text>
        <Spacer size={4} axis="vertical" />
        <Link href="/" passHref>
          <ButtonLink variant="ghost" type="success" size="large">
            Anasayfaya dön
          </ButtonLink>
        </Link>
      </Container>
    </Wrapper>
  );
};

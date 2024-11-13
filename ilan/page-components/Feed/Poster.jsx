import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Container, Wrapper } from '@/components/Layout';
import { LoadingDots } from '@/components/LoadingDots';
import { Text, TextLink } from '@/components/Text';
import { fetcher } from '@/lib/fetch';
import { usePostPages } from '@/lib/post';
import { useCurrentUser } from '@/lib/user';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './Poster.module.css';

const PosterInner = ({ user }) => {
  const contentRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const { mutate } = usePostPages();

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        setIsLoading(true);
        await fetcher('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: contentRef.current.value }),
        });
        toast.success('Serkeftin');
        contentRef.current.value = '';
        // refresh post lists
        mutate();
      } catch (e) {
        toast.error(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [mutate]
  );

  return (
    <form onSubmit={onSubmit}>
      <Container className={styles.poster}>
        <Avatar size={40} username={user.username} url={user.profilePicture} />
        <Input
          ref={contentRef}
          className={styles.input}
          placeholder={`Çi difikirî, ${user.name}?`}
          ariaLabel={`Hişê we de çi heye, ${user.name}?`}
        />
        <Button type="success" loading={isLoading}>
          Parvebike
        </Button>
      </Container>
    </form>
  );
};

const Poster = () => {
  const { data, error } = useCurrentUser();
  const loading = !data && !error;

  return (
    <Wrapper>
      <div className={styles.root}>
        <h3 className={styles.heading}>Ramanê xwe ji civak ê re parve bikin.. .📗 Dembaş 🌲</h3>
        {loading ? (
          <LoadingDots>Amade dibe..</LoadingDots>
        ) : data?.user ? (
          <PosterInner user={data.user} />
        ) : (
          <Text color="secondary">
            Jibo binivîsin {' '}
            <Link href="/login" passHref>
              <TextLink color="link" variant="highlight">
              tevlê   
              </TextLink>
            </Link>{' '}
           bibin
          </Text>
        )}
      </div>
    </Wrapper>
  );
};

export default Poster;

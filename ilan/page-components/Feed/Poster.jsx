//



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
        toast.success('ilan ');
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

  return (<div>
        
    <form onSubmit={onSubmit}>
      <Container className={styles.poster}>
        <Avatar size={40} username={user.username} url={user.profilePicture} />
        <Input
          ref={contentRef}
          className={styles.input}
          placeholder={` Yayınlamak istediğin ilanın adı,`}
          ariaLabel={`iş veya ürün ilanı ver, ${user.name}?`}
        />


 
        
        <Button type="success" loading={isLoading}>
          ilan Ver
        </Button>
      </Container>








      <Container className={styles.poster}>
        <Input
          ref={contentRef}
          className={styles.input}
          placeholder={` kategorisi `}
          ariaLabel={`iş veya ürün ilanı ver, `}
        />

      </Container>






      <Container className={styles.poster}>
        <Input
          ref={contentRef}
          className={styles.input}
          placeholder={` fiyatı, `}
          ariaLabel={`iş veya ürün ilanı ver,`}
        />

      </Container>
      
      <Container className={styles.poster}>
        <Input 
          ref={contentRef}
          className={styles.input}
          placeholder={` Açıklama`}
          ariaLabel={`iş veya ürün ilanı ver, ${user.name}?`}
        />

      </Container>
      
      
    </form></div>
  );
};

const Poster = () => {
  const { data, error } = useCurrentUser();
  const loading = !data && !error;

  return (<div>
    <Wrapper>
      
      <div style={{height:155}} className={styles.root}>
        <h3 className={styles.heading}>İlan Arayın</h3>
        {loading ? (
          <LoadingDots>Bekleyiniz..</LoadingDots>
        ) : data?.user ? (

          <Container className={styles.poster}>
          <Input
            
            className={styles.input}
            placeholder={`Aramak istediğiniz ilan adını yazın`}
            ariaLabel={`iş veya ürün ilanı ver, `}
          />
   <Button type="success" >
          ilan ara
        </Button>
        </Container>        ) : (
          <Text color="secondary">
            ilan vermek {' '}
            <Link href="/login" passHref>
              <TextLink color="link" variant="highlight">
              için   
              </TextLink>
            </Link>{' '}
           üye olun
          </Text>
        )}
      </div>
    </Wrapper>
<br></br>

    <Wrapper>
      <div className={styles.root}>
        <h3 className={styles.heading}>Yeni ilan yayınlayın  {data.user.name}</h3>
        {loading ? (
          <LoadingDots>Bekleyiniz..</LoadingDots>
        ) : data?.user ? (
          <PosterInner user={data.user} />
        ) : (
          <Text color="secondary">
            ilan vermek {' '}
            <Link href="/login" passHref>
              <TextLink color="link" variant="highlight">
              için   
              </TextLink>
            </Link>{' '}
           üye olun
          </Text>
        )}
      </div>
    </Wrapper>
    </div>  );
};

export default Poster;

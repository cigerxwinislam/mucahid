//Bismillahirrahmanirrahim



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

import { FormSelect,Form} from 'react-bootstrap';

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
      







        <Form.Select>
        <option value={1}>otomobil</option>

        <option value={3}>Arazi,SUV & Pickup</option>

        <option value={5}>Motosiklet</option>

        <option value={7}>Minivan& Panelvan</option>

<option value={9}>Ticari Araçlar</option>

<option value={11}>Elektrikli Araçlar</option>

<option value={13}>Deniz Araçları</option>

<option value={15}>Hasarlı Araçlar</option>

<option value={17}>Karavan</option>

<option value={19}>Klasik Araçlar</option>

<option value={21}>Hava Araçları</option>


<option value={23}>ATV</option>
<option value={25}>UTV</option>

<option value={27}>Engelli Plakalı Araçlar</option>
      </Form.Select>  



        <Button>
       
      

      <a >Devam</a>  
        </Button>
      </Container>






    






  
      
    
      
      
    </form></div>
  );
};

const Wesayit = () => {
  const { data, error } = useCurrentUser();
  const loading = !data && !error;

  return (<div>
    <Wrapper>
      
      <div style={{height:155}} className={styles.root}>
        <h3 className={styles.heading}>İlan Arayın</h3>
        
        

          <Container className={styles.poster}>
          <Input
            
            className={styles.input}
            placeholder={`Aramak istediğiniz ilan adını yazın`}
            ariaLabel={`iş veya ürün ilanı ver, `}
          />
   <Button type="success" >
          ilan ara
        </Button>
        </Container>     
         
      
         
     
      </div>
    </Wrapper>
<br></br>

    <Wrapper>
      <div className={styles.root}>
        <h3 className={styles.heading}>Yeni araba ilanı yayınlayın  </h3>
        {loading ? (
          <LoadingDots>Bekleyiniz..</LoadingDots>
        ) : data?.user ? (
            <PosterInner user={data.user} mre="/ilan/mal" />
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

export default Wesayit;




//Elhamdulilllahirabbülalemin
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
import { Router, useRouter } from 'next/router';

const PosterInner = ({ user }) => {
  const contentRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const router= useRouter();
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
const [mmval, setmmval] = useState("")

function Serxere() {
    console.log(mmval)
    if (mmval==1) {
        
        router.push('/')
    } else if (mmval==2) {
        router.push('/')

    }
    else if (mmval==3) {
        router.push('/')

    } else{


    } 
}
  return (<div>
        
    <form onSubmit={onSubmit}>
      

      <Container className={styles.poster}>
        <Avatar size={40} username={user.username} url={user.profilePicture} />
      




<Form.Select defaultValue={mmval} onChange={(e) =>setmmval(e.target.value)}
>
        
        <option value={1}>Sıva</option>

        <option value={3}>Montalama</option>

        <option value={5}>Alçı</option>

        <option value={7}>Boya</option>




      </Form.Select> 

      {mmval} 

        <Button >
       
      

      <a onClick={Serxere} >Devam</a>  
        </Button>
      </Container>






    






  
      
    
      
      
    </form></div>
  );
};

const Mkedkar = () => {
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
        <h3 className={styles.heading}>Yeni ilan yayınlayın  </h3>
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

export default Mkedkar;





// Bismillahirahmanirahim



import { ButtonLink } from '@/components/Button';
import { Container, Spacer, Wrapper } from '@/components/Layout';
import Link from 'next/link';
import styles from './Hero.module.css';
import Wene from './wene';
import Mwene from './wene';

const Hero = () => {
  return (
    <Wrapper>
      <div>
      <Mwene/>
      

      
        <Container justifyContent="center" className={styles.buttons}>
          <Container>
           
          </Container>
          <Spacer axis="horizontal" size={1} />
          <Container>
           
          <iframe width="560" height="315" src="https://www.youtube.com/embed/TOH4BFsuokI?si=RaZJRG2HQjTg7rDo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
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

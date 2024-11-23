// Bismillahirahmanirahim



import React from 'react';
import styles from './Nav.module.css'

import { Wrapper } from '@/components/Layout';

import { Container,Link } from 'react-bootstrap';

import { Spacer } from '@/components/Layout';



function Mmmmnav () {
 

  return (
    <nav className={styles.nav}>
      <Wrapper className={styles.wrapper}>
        <Container
          className={styles.content}
          alignItems="center"
          justifyContent="space-between"
        >
         
             
                
          <Container>
          

       
          </Container>
        </Container>
      </Wrapper>
    </nav>
  );
};

export default Mmmmnav;

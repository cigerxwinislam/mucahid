// Bismillahirahmanirahim

"use client"

import Nav from '@/components/Layout/Nav';
import Layout from 'pages/mmmpeyam/app/layout';
import Peyam from 'pages/mmpeyam';
import Mmmmnav from 'pages/mmpeyam/mmmnav';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';

function MmExample(props) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button style={{background:"black"}}  onClick={handleShow}>
        
        {props.mmnav}
      </Button>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>mesaj</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>




<Layout/>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default MmExample;

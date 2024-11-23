// Bismillahirahmanirahim



import Peyam from 'pages/mmpeyam';
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
          <Offcanvas.Title>İLAN SOHBETLERİ</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
         <Peyam/>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default MmExample;
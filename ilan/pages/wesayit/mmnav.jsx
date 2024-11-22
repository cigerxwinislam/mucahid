// Bismillahirahmanirahim



import React from 'react';
import Nav from 'react-bootstrap/Nav';

function Mmnav() {
  return (
    <Nav variant="tabs" defaultActiveKey="/home">
      <Nav.Item>
        <Nav.Link href="/home">...........</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-1"></Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="disabled" >
        Kategoriler
        </Nav.Link>
      </Nav.Item>

      <Nav.Item>
        <Nav.Link href="/home">...........</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-1"></Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="disabled" >
        Kategoriler
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default Mmnav;
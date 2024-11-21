// Bismillahirahmanirahim



import Link from 'next/link';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

function Mwene(props) {
  return (
    <Card style={{ width: '9rem' }}>
      <Card.Img variant="top" src={props.wene} />
      <Card.Body >
 
 <a href={props.derbas}>{props.nav} </a>
      </Card.Body>
    </Card>
  );
}

export default Mwene;
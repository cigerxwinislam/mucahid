// Bismillahirahmanirahim



import Link from 'next/link';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

function Mwene(props) {
  return (
    <Card style={{ width: '7rem' }}>
      <Card.Img variant="top" src={props.wene} />
      <Card.Body >
 
 <Button variant='primary' href={props.derbas}>{props.nav} </Button>
      </Card.Body>
    </Card>
  );
}

export default Mwene;
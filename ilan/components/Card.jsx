// Bismillahirahmanirahim



import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

function Mwene(props) {
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Img variant="top" src={props.wene} />
      <Card.Body>
        <Card.Title>{props.nav}</Card.Title>
        <Card.Text>
       {props.nivis}
        </Card.Text>
        <Button variant="primary">Tümünü Gör </Button>
      </Card.Body>
    </Card>
  );
}

export default Mwene;
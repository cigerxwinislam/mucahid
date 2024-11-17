// Bismillahirahmanirahim


import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

function MmCard(props) {
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Img variant="top" src="holder.js/100px180" />
      <Card.Body>
        <Card.Title>{props.nav}</Card.Title>
        <Card.Text>
        
        {props.nivis}
        </Card.Text>
        <Button variant="primary"> </Button>
      </Card.Body>
    </Card>
  );
}

export default MmCard;
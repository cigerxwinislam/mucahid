// Bismillahirahmanirahim



import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

function MmUncontrolledExample(props) {
  return (
    <Tabs
      defaultActiveKey="profile"
      id="uncontrolled-tab-example"
      className="mb-3"
    >
      <Tab eventKey="home" title={props.nav}>
        
        {props.dil}
      </Tab>
      <Tab eventKey="profile" title={props.mmnav}>
        {props.mmdil}
      </Tab>
      <Tab eventKey="contact" title={props.mnav} >
       {props.mdil}
      </Tab>
      <Tab eventKey="contact" title={props.mmmnav} >
       {props.mmmdil}
      </Tab>
    </Tabs>
  );
}

export default MmUncontrolledExample;
// Bismillahirahmanirahim



import React from 'react';
import { MDBCheckbox } from 'mdb-react-ui-kit';
import { FormControl ,Form} from 'react-bootstrap';
export default function Mmger() {
  return (
    <>
      <MDBCheckbox name='flexCheck' value='' id='flexCheckDefault' label='Default checkbox' />
      <MDBCheckbox name='flexCheck' value='' id='flexCheckChecked' label='Checked checkbox' defaultChecked />
      <MDBCheckbox name='flexCheck' value='' id='flexCheckDefault' label='Default checkbox' />
      <MDBCheckbox name='flexCheck' value='' id='flexCheckChecked' label='Checked checkbox' defaultChecked />
    
    
    
      <Form.Control size="lg" type="text" placeholder="İlan Arayın" />
    </>
  );
}
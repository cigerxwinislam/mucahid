// Bismillahirahmanirahim



import React from 'react';
import { MDBCheckbox } from 'mdb-react-ui-kit';

export default function Mmger() {
  return (
    <>
      <MDBCheckbox name='flexCheck' value='' id='flexCheckDefault' label='Default checkbox' />
      <MDBCheckbox name='flexCheck' value='' id='flexCheckChecked' label='Checked checkbox' defaultChecked />
    </>
  );
}
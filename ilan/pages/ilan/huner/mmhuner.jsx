// Bismillahirahmanirahim



import React from 'react';
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBInput,
  MDBIcon,
  MDBCheckbox
}
from 'mdb-react-ui-kit';
import { FormSelect ,Form} from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import Example from '@/components/ilan/mmodel';
import { Alert } from 'react-bootstrap';
import MDBFile from 'mdb-react-ui-kit';
function Mmmhuner() {
  return (
    <MDBContainer fluid>

      <MDBCard className='text-black m-5' style={{borderRadius: '25px'}}>
       <Alert variant='primary'>Bu sayfada sadece SANAT ve EL SANATLARI ile alakalı ilan veriniz!!!Alakasız ilanlar yayınlanmayacaktır!!!</Alert>
        <MDBCardBody>
          <MDBRow>
            <MDBCol md='10' lg='6' className='order-2 order-lg-1 d-flex flex-column align-items-center'>

              <p classNAme="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Fotoğraf Yükle</p>


              <div className="d-flex flex-row align-items-center mb-4 ">
                <MDBIcon fas icon="user me-3" size='lg'/>
               
<label>Tür</label><br></br><br></br>
                <Form.Select>
 




<option>Konut</option>

<option>İş Yeri</option>

<option>Arsa</option>

<option>Bina</option>

<option>Devre Mülk</option>

<option>Turistik Tesis</option>

   
       </Form.Select>
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="envelope me-3" size='lg'/>

                <label>Mülkiyet Durumu</label><br></br>
      <Form.Select>
    

      </Form.Select>
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="lock me-3" size='lg'/>

                <label>....</label>
      <Form.Select>
        <option>1999</option>

        <option>2000</option>

        <option>2001</option>

        <option>2002</option>

<option>2003</option>

<option>2004</option>

<option>2005</option>

<option>2006</option>

<option>2007</option>

<option>2008</option>

<option>2009</option>


<option>2015</option>

<option>2016</option>
      
        
<option>1988</option>

<option>1989</option>

<option>1990</option>

<option>1992</option>

<option>1993</option>

<option>1994</option>

<option>1995</option>

<option>1996</option>

<option>1997</option>

<option>1998</option>

<option>1999</option>

<option>2000</option>

<option>2001</option>

<option>2002</option>
<option>2003</option>

<option>2004</option>

<option>2005</option>

<option>2006</option>

<option>2007</option>

<option>2008</option>

<option>2009</option>

<option>2010</option>

<option>2011</option>

<option>2012</option>

<option>2013</option>

<option>2014</option>

<option>2015</option>

<option>2016</option>
      </Form.Select>
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="key me-3" size='lg'/>

                <label>Yakıt</label>
      <Form.Select>
      

<option>Benzin</option>

<option>LPG</option>

<option>HYBRİD</option>


      </Form.Select>
              </div>

              <div className='mb-4'>
              <MDBCheckbox name='flexCheck' value='' id='flexCheckDefault' label={<Example/>} />
                
              </div>
             <Button>İlanı Yayınla</Button>
              

            </MDBCol>

            <MDBCol md='10' lg='6' className='order-1 order-lg-2 d-flex align-items-center'>
              <MDBCardImage src='https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp' fluid/>
           
           
            </MDBCol>

          </MDBRow>
        </MDBCardBody>
      </MDBCard>

    </MDBContainer>
  );
}

export default Mmmhuner;
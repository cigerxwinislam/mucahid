//Bismillahirahmanirahim



import React from 'react'
import { Input } from 'react-chat-elements'
import { Button } from 'react-bootstrap'
function index() {
  return (
    <div>
<Input

  placeholder='Type here...'
  multiline={true}
  
 
/>

<Button >Mesaj Yaz</Button>
    </div>
  )
}

export default index
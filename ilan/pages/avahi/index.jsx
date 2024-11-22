// Bismillahirahmanirahim



import React from 'react'

import Avahi from '../serxere/mal'
import MmUncontrolledExample from '@/components/mmtabs'
import Mavahi from 'pages/ilan/mal'
function index() {
  return (
    <div>
    <MmUncontrolledExample nav="ilanlar" mmnav="Kategorilerde ara" dil={(<Avahi/>)} mmmnav=" Yeni İlan Yayınla" mmmdil={(<Mavahi/>)}/>
    </div>
  )
}

export default index
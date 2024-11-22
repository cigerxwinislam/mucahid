// Bismillahirahmanirahim



import { Feed } from '@/page-components/Feed'
import Mmkinc from 'pages/ilan/kinc/mmkinc'
import Kinc from 'pages/serxere/kinc'
import React from 'react'
import MmUncontrolledExample from '@/components/mmtabs'
function Wesayit() {
  return (
    <div>

<MmUncontrolledExample nav="ilanlar" mmnav="Kategorilerde ara" dil={(
  <Kinc/>)} mmmnav=" Yeni İlan Yayınla" mmmdil={(<Mmkinc/>)}/>

    </div>
  )
}

export default Wesayit
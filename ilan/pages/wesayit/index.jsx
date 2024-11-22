// Bismillahirahmanirahim




import Wesayit from '../serxere/wesayit'
import React from 'react'

import { NavItem,Nav } from 'react-bootstrap'
import MmExample from './mnav'
import MmUncontrolledExample from '@/components/mmtabs'
import Mmger from './mmger'
function Seido() {
  return (
    <div>
<MmUncontrolledExample nav="ilanlar" mmnav="Ara" mmdil={(<Mmger/>)}  mmmnav="Yeni İlan Ver" dil={(<Wesayit/>)}  />




    </div>
  )
}

export default Seido
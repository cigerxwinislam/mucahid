// Bismillahirahmanirahim



import { Feed } from '@/page-components/Feed'
import Kargeh from 'pages/serxere/kargeh'
import React from 'react'

import MmUncontrolledExample from '@/components/mmtabs'
import Mmkargeh from 'pages/ilan/kargeh/mkargeh'
function Wesayit() {
  return (
    <div>

<MmUncontrolledExample nav="ilanlar" mmnav="Kategorilerde ara" dil={(<Kargeh/>)} mmmnav=" Yeni İlan Yayınla" mmmdil={(<Mmkargeh/>)}/>


    </div>
  )
}

export default Wesayit
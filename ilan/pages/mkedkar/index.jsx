// Bismillahirahmanirahim



import MmUncontrolledExample from '@/components/mmtabs'
import { Feed } from '@/page-components/Feed'
import Mmkedkar from 'pages/ilan/kedkar/mkedkar'
import Mkargeh from 'pages/serxere/kargeh'
import Kargeh from 'pages/serxere/kargeh'
import Kinc from 'pages/serxere/kinc'
import Mkedkar from 'pages/serxere/mkedkar'
import React from 'react'

function Wesayit() {
  return (
    <div>

<MmUncontrolledExample nav="ilanlar" mmnav="Kategorilerde ara" dil={(<Kargeh/>)} mmmnav=" Yeni İlan Yayınla" mmmdil={(<Mmkedkar/>)}/>


    </div>
  )
}

export default Wesayit
// Bismillahirahmanirahim



import React from 'react'

import { ChatItem ,MessageBox} from 'react-chat-elements'

import 'react-chat-elements/dist/main.css'
function Peyam() {
  return (
    <div>



<ChatItem
  avatar={'https://facebook.github.io/react/img/logo.svg'}
  alt={'Reactjs'}
  title={'Kullanıcı'}
  subtitle={'Mesaj yaz'}
  date={new Date()}
  unread={0}
/>



<MessageBox
  position={'left'}
  type={'photo'}
  text={'react.svg'}
  data={{
    uri: 'https://facebook.github.io/react/img/logo.svg',
    status: {
      click: false,
      loading: 0,
    },
  }}
/>






<MessageBox
  reply={{
    photoURL: 'https://facebook.github.io/react/img/logo.svg',
    title: 'elit magna',
    titleColor: '#8717ae',
    message: 'Aliqua amet incididunt id nostrud',
  }}
  onReplyMessageClick={() => console.log('reply clicked!')}
  position={'left'}
  type={'text'}
  text={'Tempor duis do voluptate enim duis velit veniam aute ullamco dolore duis irure.'}
/>
    </div>
  )
}

export default Peyam
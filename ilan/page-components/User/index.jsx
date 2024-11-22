//



import MmUncontrolledExample from '@/components/mmtabs';
import styles from './User.module.css';
import UserHeader from './UserHeader';
import UserPosts from './UserPosts';

import { Button } from 'react-bootstrap';
import Mmsettings from './mmsettings/mmsettings';
export const User = ({ user }) => {
  return (
    <div className={styles.root}>
      <UserHeader user={user} />

      <MmUncontrolledExample mmmdil={(<Mmsettings/>)} mmnav="Yayındaki ilanlarım (1)" mmmnav="ayarlar" mmdil={(      <UserPosts user={user}  />
)}/>







      
    </div>
  );
};

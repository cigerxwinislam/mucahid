//



import styles from './User.module.css';
import UserHeader from './UserHeader';
import UserPosts from './UserPosts';

import { Button } from 'react-bootstrap';
export const User = ({ user }) => {
  return (
    <div className={styles.root}>
      <UserHeader user={user} />
      <Button href="/mmpeyam">Mesaj yaz</Button>

      <UserPosts user={user} />





      
    </div>
  );
};

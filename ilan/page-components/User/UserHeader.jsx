



import { Avatar } from '@/components/Avatar';
import { Container } from '@/components/Layout';
import styles from './UserHeader.module.css';

import { Button } from 'react-bootstrap';
const UserHeader = ({ user }) => {
  return (
    <Container className={styles.root} column alignItems="center">
      <div className={styles.avatar}>
        <Avatar size={168} username={user.username} url={user.profilePicture} />
      </div>
      <h1>
        <div className={styles.name}>{user.name}</div>
      </h1>
      <p className={styles.bio}>{user.bio}</p>
      <Button  href="/mmpeyam">Mesaj yaz</Button>

    </Container>
  );
};

export default UserHeader;

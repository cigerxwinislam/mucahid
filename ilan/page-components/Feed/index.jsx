// 



import { Spacer } from '@/components/Layout';
import styles from './Feed.module.css';
import Poster from './Poster';
import PostList from './PostList';
import MmNav from '../mmnu/nav';




export const Feed = () => {
  return (
    <div className={styles.root}>
      <Spacer size={1} axis="vertical" />
      <Poster />
      <MmNav/>
      <PostList />
    </div>
  );
};

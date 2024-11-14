import { Feed } from '@/page-components/Feed';
import Head from 'next/head';

const FeedPage = () => {
  return (
    <>
      <Head>
        <title>İnşaat ve diğer İş ilanları</title>
      </Head>
      <Feed />
    </>
  );
};

export default FeedPage;

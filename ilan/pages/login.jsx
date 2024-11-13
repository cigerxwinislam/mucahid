import { Login } from '@/page-components/Auth';
import Head from 'next/head';

const LoginPage = () => {
  return (
    <>
      <Head>
        <title>Giriş Yap</title>
      </Head>
      <Login />
    </>
  );
};

export default LoginPage;

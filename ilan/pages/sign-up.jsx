import { SignUp } from '@/page-components/Auth';
import Head from 'next/head';

const SignupPage = () => {
  return (
    <>
      <Head>
        <title>Kaydol</title>
      </Head>
      <SignUp />
    </>
  );
};

export default SignupPage;

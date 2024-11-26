

import ChatPage from "./(home)/chat";
import Layout from "./layout";

const Page = () => {
    return (
        <div className="relative overflow-hidden rounded-3xl">
           <Layout/>
           <ChatPage/>
        </div>
    );
};

export default Page;

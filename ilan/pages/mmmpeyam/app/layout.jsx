//



export const dynamic = "force-dynamic";


import { SocketProvider } from "../context/SocketContext"; 

import { ToasterProvider } from "../providers/toast-provider";

import SocketIndicator from "../components/SocketIndicator";

import { EdgeStoreProvider } from "../lib/edgestore";



const Layout = ({children}) => {
    return (
        
            <div
            >
                <EdgeStoreProvider>
                    
                        <SocketProvider>
                            <ToasterProvider />
                            <SocketIndicator />

                            <main>
                                {children}
                            </main>
                        </SocketProvider>
                    
                </EdgeStoreProvider>
            </div>
      
    );
};

export default Layout;

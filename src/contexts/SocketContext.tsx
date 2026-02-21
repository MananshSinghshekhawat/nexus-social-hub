import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (user && token) {
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
                auth: { token },
            });

            setSocket(newSocket);

            newSocket.on('getOnlineUsers', (users: string[]) => {
                setOnlineUsers(users);
            });

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user, token]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

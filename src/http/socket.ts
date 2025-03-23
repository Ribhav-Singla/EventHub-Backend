import { Server, Socket } from "socket.io"
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Server as HttpServer } from 'http'
import client from '../db/index'

interface AuthenticatedSocket extends Socket {
    userId?: string
}

const userSocketMap: Record<string, AuthenticatedSocket> = {}

export default function intializeSocket(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    })

    io.use(async (socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token ? socket.handshake.auth.token.split(" ")[1] : '';
        if (!token) {
            return next(new Error("No token provided"))
        }

        try {
            const response = jwt.verify(token, process.env.JWT_PASSWORD as string) as { userId: string }
            if (!response) {
                return next(new Error("Invalid token"))
            }
            socket.userId = response.userId
            userSocketMap[socket.userId] = socket
            next()

        } catch (error) {
            console.log('error occured while verify socket token: ', error);
            next(new Error("Invalid token"));
        }
    })

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log('new connection', socket.id);

        // get online users
        socket.on("getOnlineUsers", async () => {
            try {
                const userChats = await client.user.findUnique({
                    where: {
                        id: socket.userId
                    },
                    select: {
                        chatsReceived: {
                            select: {
                                userId: true
                            }
                        }
                    }
                })
                if (!userChats) {
                    socket.emit("onlineUsers", []);
                    return;
                }
                const chatUserIds = userChats.chatsReceived.map(chat => chat.userId);
                const onlineUsers = chatUserIds.filter(userId => userId in userSocketMap);
                socket.emit("onlineUsers", onlineUsers);
            } catch (error) {
                console.error("Error getting online users, ", error)
            }
        })

        // set online status
        socket.on("setOnlineStatus", async () => {
            try {
                const userChats = await client.user.findUnique({
                    where: {
                        id: socket.userId
                    },
                    select: {
                        chatsInitiated: {
                            select: {
                                organizerId: true
                            }
                        }
                    }
                })
                if (userChats) {
                    const organizers = userChats.chatsInitiated.map(chat => chat.organizerId);
                    const onlineOrganizers = organizers.filter(orgId => orgId in userSocketMap);
                    onlineOrganizers.forEach(orgId => {
                        userSocketMap[orgId]?.emit("userConnected", socket.userId);
                    });
                }
            } catch (error) {
                console.error("Error setting online status, ", error)
            }
        })

        // disconnect and set online status to offline
        socket.on("disconnect", async () => {
            console.log('user disconnected', socket.id);
            if (!socket.userId)
                return;
            delete userSocketMap[socket.userId]
            try {
                const userChats = await client.user.findUnique({
                    where: {
                        id: socket.userId
                    },
                    select: {
                        chatsInitiated: {
                            select: {
                                organizerId: true
                            }
                        }
                    }
                })
                if (userChats) {
                    const organizers = userChats.chatsInitiated.map(chat => chat.organizerId);
                    const onlineOrganizers = organizers.filter(orgId => orgId in userSocketMap);
                    onlineOrganizers.forEach(orgId => {
                        userSocketMap[orgId]?.emit("userDisconnected", socket.userId);
                    });
                }
            } catch (error) {
                console.error("Error notifying organizers about user disconnection, ", error);
            }
        })
    })
}

export function getReceiverSocket(userId: string) {
    return userSocketMap[userId];
}
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceiverSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../db/index"));
const userSocketMap = {};
function intializeSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*"
        }
    });
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        const token = socket.handshake.auth.token ? socket.handshake.auth.token.split(" ")[1] : '';
        if (!token) {
            return next(new Error("No token provided"));
        }
        try {
            const response = jsonwebtoken_1.default.verify(token, process.env.JWT_PASSWORD);
            if (!response) {
                return next(new Error("Invalid token"));
            }
            socket.userId = response.userId;
            userSocketMap[socket.userId] = socket;
            next();
        }
        catch (error) {
            console.log('error occured while verify socket token: ', error);
            next(new Error("Invalid token"));
        }
    }));
    io.on('connection', (socket) => {
        console.log('new connection', socket.id);
        // get online users
        socket.on("getOnlineUsers", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const userChats = yield index_1.default.user.findUnique({
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
                });
                if (!userChats) {
                    socket.emit("onlineUsers", []);
                    return;
                }
                const chatUserIds = userChats.chatsReceived.map(chat => chat.userId);
                const onlineUsers = chatUserIds.filter(userId => userId in userSocketMap);
                socket.emit("onlineUsers", onlineUsers);
            }
            catch (error) {
                console.error("Error getting online users, ", error);
            }
        }));
        // set online status
        socket.on("setOnlineStatus", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const userChats = yield index_1.default.user.findUnique({
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
                });
                if (userChats) {
                    const organizers = userChats.chatsInitiated.map(chat => chat.organizerId);
                    const onlineOrganizers = organizers.filter(orgId => orgId in userSocketMap);
                    onlineOrganizers.forEach(orgId => {
                        var _a;
                        (_a = userSocketMap[orgId]) === null || _a === void 0 ? void 0 : _a.emit("userConnected", socket.userId);
                    });
                }
            }
            catch (error) {
                console.error("Error setting online status, ", error);
            }
        }));
        // disconnect and set online status to offline
        socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
            console.log('user disconnected', socket.id);
            if (!socket.userId)
                return;
            delete userSocketMap[socket.userId];
            try {
                const userChats = yield index_1.default.user.findUnique({
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
                });
                if (userChats) {
                    const organizers = userChats.chatsInitiated.map(chat => chat.organizerId);
                    const onlineOrganizers = organizers.filter(orgId => orgId in userSocketMap);
                    onlineOrganizers.forEach(orgId => {
                        var _a;
                        (_a = userSocketMap[orgId]) === null || _a === void 0 ? void 0 : _a.emit("userDisconnected", socket.userId);
                    });
                }
            }
            catch (error) {
                console.error("Error notifying organizers about user disconnection, ", error);
            }
        }));
    });
}
exports.default = intializeSocket;
function getReceiverSocket(userId) {
    return userSocketMap[userId];
}
exports.getReceiverSocket = getReceiverSocket;

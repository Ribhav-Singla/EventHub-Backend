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
exports.chatRouter = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../middleware/user");
const index_1 = __importDefault(require("../../../db/index"));
const socket_1 = require("../../socket");
exports.chatRouter = express_1.default.Router();
// startChat
exports.chatRouter.post('/:organizerId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside startChat');
    const userId = req.userId;
    const organizerId = req.params.organizerId;
    if (!userId) {
        throw new Error('Unauthorized');
    }
    try {
        const existingChat = yield index_1.default.chat.findFirst({
            where: { userId, organizerId },
            select: {
                id: true,
                messages: {
                    select: {
                        senderId: true,
                        receiverId: true,
                        text: true,
                        seen: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (existingChat) {
            res.json(existingChat);
            return;
        }
        const chat = yield index_1.default.chat.create({
            data: {
                userId: userId,
                organizerId: organizerId,
                messages: {
                    create: [
                        {
                            senderId: userId,
                            receiverId: organizerId,
                            text: 'Hi, wanted to enquiry!',
                            seen: false
                        }
                    ]
                }
            }
        });
        res.json(chat);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// sendMessage
exports.chatRouter.post('/sendmessage/:chatId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside send message');
    const userId = req.userId;
    const chatId = req.params.chatId;
    const { receiverId, text } = req.body;
    if (!userId) {
        throw new Error('Unauthorized');
    }
    try {
        const message = yield index_1.default.message.create({
            data: {
                senderId: userId,
                receiverId: receiverId,
                text: text,
                seen: false,
                chatId: chatId
            }
        });
        // realtime functionality
        const receiverSocket = (0, socket_1.getReceiverSocket)(receiverId);
        if (receiverSocket) {
            receiverSocket.emit('newMessage', message);
        }
        res.json(message);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// organizersChat
exports.chatRouter.get('/organizer', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const organizerId = req.userId;
    try {
        const chats = yield index_1.default.chat.findMany({
            where: {
                organizerId: organizerId
            },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(chats);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// messages for a specific chat
exports.chatRouter.get('/:chatId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = req.params.chatId;
    try {
        const messages = yield index_1.default.chat.findFirst({
            where: {
                id: chatId
            },
            select: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                }
            }
        });
        res.json(messages);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// marking messages as seen
exports.chatRouter.put('/messagesseen/:chatId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = req.params.chatId;
    const { receiverId } = req.body;
    try {
        yield index_1.default.message.updateMany({
            where: {
                chatId: chatId,
                receiverId: receiverId,
                seen: false,
            },
            data: {
                seen: true
            }
        });
        res.json('messages seen');
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));

import express from 'express';
import { userMiddleware } from '../../middleware/user';
import client from '../../../db/index';
import { getReceiverSocket } from '../../socket';

export const chatRouter = express.Router();

// startChat
chatRouter.post('/:organizerId', userMiddleware, async (req, res) => {
    console.log('inside startChat');
    const userId = req.userId
    const organizerId = req.params.organizerId
    if (!userId) {
        throw new Error('Unauthorized');
    }
    try {

        const existingChat = await client.chat.findFirst({
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
            res.json(existingChat)
            return
        }

        const chat = await client.chat.create({
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
        })

        res.json(chat)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

// sendMessage
chatRouter.post('/sendmessage/:chatId', userMiddleware, async (req, res) => {
    console.log('inside send message')
    const userId = req.userId
    const chatId = req.params.chatId
    const { receiverId, text } = req.body
    if (!userId) {
        throw new Error('Unauthorized')
    }
    try {
        const message = await client.message.create({
            data: {
                senderId: userId,
                receiverId: receiverId,
                text: text,
                seen: false,
                chatId: chatId
            }
        })

        // realtime functionality
        const receiverSocket = getReceiverSocket(receiverId);
        if(receiverSocket){
            receiverSocket.emit('newMessage', message);
        }

        res.json(message)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

// organizersChat
chatRouter.get('/organizer', userMiddleware, async (req, res) => {
    const organizerId = req.userId
    try {
        const chats = await client.chat.findMany({
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
        })
        res.json(chats)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

// messages for a specific chat
chatRouter.get('/:chatId', userMiddleware, async (req, res) => {
    const chatId = req.params.chatId
    try {
        const messages = await client.chat.findFirst({
            where: {
                id: chatId
            },
            select: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                }
            }
        })
        res.json(messages)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

// marking messages as seen
chatRouter.put('/messagesseen/:chatId', userMiddleware, async (req, res) => {
    const chatId = req.params.chatId
    const { receiverId } = req.body
    try {
        await client.message.updateMany({
            where: {
                chatId: chatId,
                receiverId: receiverId,
                seen: false,
            },
            data: {
                seen: true
            }
        })
        res.json('messages seen')
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})
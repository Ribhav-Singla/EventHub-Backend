import express from 'express';
import { userMiddleware } from '../../middleware/user';
import { restrictGuestActions } from '../../middleware/guest';
import client from '../../../db/index';
import { getReceiverSocket } from '../../socket';

export const chatRouter = express.Router();

// startChat
chatRouter.post('/:organizerId', userMiddleware, async (req, res) => {
    console.log('inside startChat');
    const userId = req.userId;
    const { eventId } = req.body;
    const organizerId = req.params.organizerId;
    if (!userId) {
        throw new Error('Unauthorized');
    }
    try {

        const event = await client.event.findUnique({
            where: {
                id: eventId
            }
        })
        if (!event) {
            throw new Error('Event not found');
        }

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
                eventId: eventId,
                messages: {
                    create: [
                        {
                            senderId: userId,
                            receiverId: organizerId,
                            text: `Hi, wanted to enquiry regarding ${event.title}!`,
                            seen: false
                        }
                    ]
                }
            },
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
        })

        res.json(chat)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

// sendMessage
chatRouter.post('/sendmessage/:chatId', userMiddleware, restrictGuestActions ,async (req, res) => {
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
        if (receiverSocket) {
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
                organizerId: organizerId,
                event: {
                    isDeleted: false
                }
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
                    take: 1,
                }
            },
        })

        chats.sort((a, b) => {
            const latestMessageA = a.messages[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : 0;
            const latestMessageB = b.messages[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : 0;
            return latestMessageB - latestMessageA;
        });
        
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
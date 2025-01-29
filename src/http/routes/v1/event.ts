import express from 'express'
import { userMiddleware } from '../../middleware/user'
import client from '../../../db/index'
import moment from 'moment-timezone'

export const eventRouter = express.Router()

eventRouter.post('/', userMiddleware, async (req, res) => {
    console.log('inside event');    
    try {
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }
        const isoDate = new Date(`${req.body.date}T${req.body.time_frame[0].time}Z`);
        const event = await client.event.create({
            data: {
                title: req.body.title,
                type: req.body.type,
                category: req.body.category,
                description: req.body.description,
                price: req.body.price,
                total_tickets: req.body.total_tickets,
                tickets_sold: '0',
                date: isoDate,
                time_frame: req.body.time_frame,
                images: req.body.images,
                creatorId: req.userId,
                location: {
                    create: [{
                        venue: req.body.location[0].venue,
                        city: req.body.location[0].city,
                        country: req.body.location[0].country
                    }]
                },
                organizer_details: {
                    create: [{
                        phone: req.body.organizer_details[0].phone,
                        email: req.body.organizer_details[0].email
                    }]
                }
            }
        })
        res.status(201).json({ eventId: event.id })
    } catch (error) {
        console.log('error in event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

eventRouter.get('/', async (req, res) => {
    const limit = 9;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const fetched_events = await client.event.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                images: true,
                date: true,
                location: {
                    select: {
                        venue: true,
                        city: true,
                    }
                },
                price: true
            },
            take: limit,
            skip: skip
        })

        const total_events = await client.event.count()

        const events = fetched_events.map(event => ({
            ...event,
            images: event.images.slice(0, 1) || []
        }));

        res.status(200).json({
            events,
            total_events
        })
    } catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

eventRouter.get('/upcoming', async (req, res) => {
    const limit = Number(req.query.limit) | 1
    try {

        const currentDateTimeIST = moment.utc().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const fetched_events = await client.event.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                images: true,
                date: true,
                location: {
                    select: {
                        venue: true,
                        city: true,
                    }
                },
                price: true,
                time_frame: true
            },
            where: {
                date: {
                    gte: currentDateTimeIST,
                },
            },
            orderBy: [
                { date: 'asc' },
            ],
            take: limit,
        })

        const events = fetched_events.map(event => ({
            ...event,
            images: event.images.slice(0, 1) || []
        }));
        res.status(200).json(events)
    } catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

eventRouter.get('/:eventId', async (req, res) => {
    const eventId = req.params.eventId
    try {
        const event = await client.event.findUnique({
            where: {
                id: eventId
            },
            select: {
                id: true,
                title: true,
                type: true,
                category: true,
                description: true,
                price: true,
                total_tickets: true,
                tickets_sold: true,
                date: true,
                time_frame: true,
                images: true,
                location: {
                    select: {
                        venue: true,
                        city: true,
                        country: true,
                    }
                },
                organizer_details: {
                    select: {
                        phone: true,
                        email: true,
                    }
                },
                wishlist: {
                    where: {
                        userId: req.userId,
                    },
                    select: {
                        id: true
                    }
                }
            }
        })

        let heart = false;
        if (event && event.wishlist && event.wishlist.length > 0) {
            heart = true
        }

        res.status(200).json({
            event,
            heart
        })
    } catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

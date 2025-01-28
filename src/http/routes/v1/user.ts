import express from "express";
import { userMiddleware } from "../../middleware/user";
import client from "../../../db/index";

export const userRouter = express.Router();

userRouter.post("/wishlist/:eventId", userMiddleware, async (req, res) => {
    console.log("inside wishlist");
    const eventId = req.params.eventId;
    if (!req.userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const heart = req.body.heart;
    try {
        if (!heart) {
            const wishlist = await client.wishlist.deleteMany({
                where: {
                    userId: req.userId,
                    eventId: eventId,
                },
            });
            res.json(wishlist);
        } else {
            const wishlist = await client.wishlist.create({
                data: {
                    userId: req.userId,
                    eventId: eventId,
                },
            });
            res.json(wishlist);
        }
    } catch (error) {
        console.error("error occured in wishlist ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

userRouter.get("/events", userMiddleware, async (req, res) => {
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const events = await client.event.findMany({
            where: {
                creatorId: req.userId,
            },
            select: {
                id: true,
                title: true,
                location: {
                    select: {
                        city: true,
                        country: true,
                    },
                },
                date: true,
                price: true,
                total_tickets: true,
                tickets_sold: true,
            },
            take: limit,
            skip: skip,
        });

        const total_events = await client.event.count({
            where: {
                creatorId: req.userId,
            },
        });

        res.json({
            events,
            total_events,
        });
    } catch (error) {
        console.error("error occured in events ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

userRouter.get("/wishlist", userMiddleware, async (req, res) => {
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const wishlist = await client.wishlist.findMany({
            where: {
                userId: req.userId
            },
            select: {
                id: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        location: {
                            select: {
                                city: true,
                                country: true
                            }
                        },
                        date: true,
                        price: true,
                    }
                }
            },
            take: limit,
            skip: skip,
        })

        const wishlistCount = await client.wishlist.count({
            where: {
                userId: req.userId
            }
        })

        res.json({
            wishlist,
            wishlistCount
        });
    } catch (error) {
        console.error("error occured in wishlist ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

userRouter.get('/:eventId', async (req, res) => {
    const eventId = req.params.eventId
    try {
        const event = await client.event.findUnique({
            where: {
                id: eventId,
                creatorId: req.userId
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
                }
            }
        })

        res.status(200).json(event)
    } catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

userRouter.put('/:eventId', userMiddleware, async (req, res) => {
    console.log('ínside update');    
    const eventId = req.params.eventId
    try {
        const isoDate = new Date(`${req.body.date}T${req.body.time_frame[0].time}Z`);
        
        const location = await client.location.findFirst({ where : {eventId : eventId},select:{id:true}})
        const organizer_details =  await client.organizer.findFirst({ where: {eventId:eventId},select:{id:true}})
        
        const event = await client.event.update({
            where: {
                id: eventId,
                creatorId: req.userId
            },
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
                    update: [{
                        venue: req.body.location[0].venue,
                        city: req.body.location[0].city,
                        country: req.body.location[0].country
                    }]
                },
                organizer_details: {
                    update: [{
                        phone: req.body.organizer_details[0].phone,
                        email: req.body.organizer_details[0].email
                    }]
                }

            }
        })
        res.status(200).json({eventId: event.id})
    } catch (error) {
        console.log('error in update event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

userRouter.delete('/:eventId', userMiddleware,async(req,res)=>{
    const eventId = req.params.eventId;
    try {
        const event = await client.event.delete({
            where:{
                id: eventId,
                creatorId: req.userId
            }
        })
        res.json({eventId: event.id})
    } catch (error) {
        console.log('error in delete event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})
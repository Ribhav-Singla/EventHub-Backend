import express from "express";
import { userMiddleware } from "../../middleware/user";
import client from "../../../db/index";
import bcrypt from 'bcrypt';
import moment from "moment-timezone";

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
    const status = req.query.status || "all"
    const category = req.query.category || "all"
    const title = req.query.title || ""
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {

        const filter: any = {
            creatorId: req.userId
        }
        if (category !== "all") {
            filter.category = category
        }
        if (title) {
            filter.title = {
                contains: title,
                mode: "insensitive"
            }
        }
        if (status !== "all") {
            const currentDateTimeIST = moment
                .utc()
                .add(5, "hours")
                .add(30, "minutes")
                .format("YYYY-MM-DDTHH:mm:ss[Z]");
            if (status === "active") {
                filter.date = { gte: currentDateTimeIST };
            } else if (status === "closed") {
                filter.date = { lt: currentDateTimeIST };
            }
        }

        const events = await client.event.findMany({
            where: filter,
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
            where: filter
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
    const category = req.query.category || "all";
    const status = req.query.status || "all";
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    try {
        let filter: any = {
            userId: req.userId,
        };

        if (category !== "all") {
            filter.event = { category };
        }

        if (status !== "all") {
            const currentDateTimeIST = moment
                .utc()
                .add(5, "hours")
                .add(30, "minutes")
                .format("YYYY-MM-DDTHH:mm:ss[Z]");

            if (!filter.event) {
                filter.event = {};
            }

            if (status === "active") {
                filter.event.date = { gte: currentDateTimeIST };
            } else if (status === "closed") {
                filter.event.date = { lt: currentDateTimeIST };
            }
        }

        const wishlist = await client.wishlist.findMany({
            where: filter,
            select: {
                id: true,
                event: {
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
                    },
                },
            },
            take: limit,
            skip: skip,
        });

        const wishlistCount = await client.wishlist.count({
            where: filter,
        });

        res.json({
            wishlist,
            wishlistCount,
        });
    } catch (error) {
        console.error("Error occurred in wishlist:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

userRouter.get('/profile/data', userMiddleware, async (req, res) => {
    console.log('inside profile');
    try {
        const user = await client.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                phone: true,
                bio: true,
                linkedIn: true,
                twitter: true,
                newsletter_subscription: true,
            }
        })
        res.json(user)
    } catch (error) {
        console.log('error in get profile', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

userRouter.put('/profile/data',userMiddleware,async(req,res)=>{
    try {
        const user = await client.user.update({
            where:{
                id:req.userId
            },
            data:{
                phone:req.body.phone,
                bio:req.body.bio,
                linkedIn:req.body.linkedIn,
                twitter:req.body.twitter,
                newsletter_subscription: req.body.newsletter_subscription
            }
        })
        res.json({
            userId: user.id
        })
    } catch (error) {
        console.log('error in update profile', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

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
    console.log('Inside update');
    const eventId = req.params.eventId;

    try {
        let isoDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
            isoDate = new Date(`${req.body.date}T${req.body.time_frame[0].time}Z`);
        } else {
            const extractedDate = req.body.date.split("T")[0];
            isoDate = new Date(`${extractedDate}T${req.body.time_frame[0].time}Z`);
        }

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
                date: isoDate,
                time_frame: req.body.time_frame,
                images: req.body.images,
                creatorId: req.userId,
                location: {
                    update: {
                        where: {
                            eventId: eventId,
                        },
                        data: {
                            venue: req.body.location[0].venue,
                            city: req.body.location[0].city,
                            country: req.body.location[0].country
                        }
                    }
                },
                organizer_details: {
                    update: {
                        where: {
                            eventId: eventId,
                        },
                        data: {
                            phone: req.body.organizer_details[0].phone,
                            email: req.body.organizer_details[0].email
                        }
                    }
                }
            }
        });

        res.status(200).json({ eventId: event.id });
    } catch (error) {
        console.log('Error in update event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

userRouter.delete('/:eventId', userMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await client.event.delete({
            where: {
                id: eventId,
                creatorId: req.userId
            }
        })
        res.json({ eventId: event.id })
    } catch (error) {
        console.log('error in delete event', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

userRouter.post('/update/password', userMiddleware, async (req, res) => {
    try {
        const user = await client.user.findUnique({
            where: {
                id: req.userId
            }
        })

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return
        }

        if (req.body.current_password) {
            const isValid = bcrypt.compareSync(req.body.current_password, user.password)
            if (!isValid) {
                res.status(401).json({ message: 'Invalid current password' })
                return
            }

        }

        // update with req.body.new_password
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds)
        const hashedPassword = bcrypt.hashSync(req.body.new_password, salt)
        const userUpdate = await client.user.update({
            where: {
                id: req.userId
            },
            data: {
                password: hashedPassword
            }
        })
        res.json({ userId: userUpdate.id })
    } catch (error) {
        console.log('error in update password', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

userRouter.post('/ticket/transaction/:eventId', userMiddleware, async (req, res) => {
    console.log('inside transaction');

    if (!req.userId || typeof req.userId !== 'string') {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const ticket_transaction = await client.$transaction(async (client) => {
            const event = await client.event.findUnique({
                where: {
                    id: req.params.eventId,
                },
            });

            if (!event) {
                res.status(404).json({ message: 'Event not found' });
                return;
            }

            if (event.total_tickets === null || event.total_tickets - event.tickets_sold >= req.body.ticket_quantity) {
                await client.event.update({
                    where: {
                        id: req.params.eventId,
                    },
                    data: {
                        tickets_sold: event.tickets_sold + req.body.ticket_quantity,
                    },
                });

                if (!req.userId) {
                    throw new Error('User ID is undefined');
                }

                const transaction = await client.transaction.create({
                    data: {
                        userId: req.userId,
                        eventId: req.params.eventId,
                        amount: req.body.ticket_amount,
                        ticket_details: {
                            create: [
                                {
                                    ticket_quantity: req.body.ticket_quantity,
                                    ticket_category: req.body.ticket_category,
                                    ticket_price: req.body.ticket_price,
                                    payment_type: req.body.payment_type,
                                    event_title: req.body.event_title,
                                    event_category: req.body.event_category,
                                    event_date: req.body.event_date,
                                    event_venue: req.body.event_venue,
                                    event_time: req.body.event_time,
                                    attendee: {
                                        create: req.body.attendees.map((attendee: any) => ({
                                            name: attendee.name,
                                            age: attendee.age,
                                        })),
                                    },
                                },
                            ],
                        },
                    },
                });

                res.status(201).json({
                    transactionId: transaction.id,
                });
            } else {
                res.status(400).json({ message: 'Not enough tickets available' });
            }
        });
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


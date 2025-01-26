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

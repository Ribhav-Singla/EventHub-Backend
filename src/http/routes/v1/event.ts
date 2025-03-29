import express from "express";
import client from "../../../db/index";
import moment from "moment-timezone";
import { optionalUserMiddleware } from "../../middleware/user";

export const eventRouter = express.Router();

eventRouter.get("/", async (req, res) => {
    const limit = 9;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    try {
        const filters: any = {
            isDeleted: false,
            date: {
                gte: new Date()
            }
        };

        // Title Filter (Case-insensitive search)
        if (typeof req.query.title === "string" && req.query.title.trim() !== "") {
            filters.title = { contains: req.query.title, mode: "insensitive" };
        }

        // Function to safely extract array values from req.query
        const extractArray = (param: unknown): string[] => {
            if (!param) return [];
            if (Array.isArray(param))
                return param.filter((item): item is string => typeof item === "string");
            if (typeof param === "string") return [param];
            return [];
        };

        // Location Filter (Check inside relation)
        const locations = extractArray(req.query.location);
        if (locations.length > 0) {
            filters.location = { some: { country: { in: locations } } };
        }

        // Category Filter
        const categories = extractArray(req.query.category);
        if (categories.length > 0) {
            filters.category = { in: categories };
        }

        // Type Filter (Fixing incorrect key)
        const types = extractArray(req.query.type); // Ensure correct field name
        if (types.length > 0) {
            filters.type = { in: types };
        }

        // Price Filter (Ensure valid numbers)
        if (req.query.min_price || req.query.max_price) {
            filters.general_ticket_price = {};
            if (
                typeof req.query.min_price === "string" &&
                !isNaN(Number(req.query.min_price))
            ) {
                filters.general_ticket_price.gte = Number(req.query.min_price);
            }
            if (
                typeof req.query.max_price === "string" &&
                !isNaN(Number(req.query.max_price))
            ) {
                filters.general_ticket_price.lte = Number(req.query.max_price);
            }
        }

        // Date Filter
        if (req.query.start_date || req.query.end_date) {
            filters.date = {};

            if (typeof req.query.start_date === "string" && !isNaN(Date.parse(req.query.start_date))) {
                filters.date.gte = new Date(`${req.query.start_date}T00:00:00Z`);
            }
            if (typeof req.query.end_date === "string" && !isNaN(Date.parse(req.query.end_date))) {
                filters.date.lte = new Date(`${req.query.end_date}T23:59:59Z`);
            }
        }

        // Fetch events with filters
        const fetched_events = await client.event.findMany({
            where: Object.keys(filters).length > 0 ? filters : undefined,
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
                        country: true, // Ensure country is selected
                    },
                },
                general_ticket_price: true,
            },
            take: limit,
            skip: skip,
        });

        // Get total event count based on filters
        const total_events = await client.event.count({
            where: Object.keys(filters).length > 0 ? filters : undefined,
        });

        // Return only the first image per event
        const events = fetched_events.map((event: {
            location: {
                venue: string;
                city: string;
                country: string;
            }[];
            id: string;
            title: string;
            description: string;
            general_ticket_price: number;
            date: Date;
            images: string[];
        }) => ({
            ...event,
            images: event.images.length > 0 ? [event.images[0]] : [],
        }));

        res.status(200).json({
            events,
            total_events,
        });
    } catch (error) {
        console.log("Error in get events", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

eventRouter.get("/upcoming", async (req, res) => {
    const limit = Number(req.query.limit) | 1;
    const skip = Number(req.query.skip) || 0;
    try {
        const currentDateTimeIST = moment
            .utc()
            .add(5, "hours")
            .add(30, "minutes")
            .format("YYYY-MM-DDTHH:mm:ss[Z]");
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
                    },
                },
                general_ticket_price: true,
                time_frame: true,
            },
            where: {
                date: {
                    gte: currentDateTimeIST,
                },
                isDeleted: false
            },
            orderBy: [{ date: "asc" }],
            take: limit,
            skip: skip
        });

        const events = fetched_events.map((event: any) => ({
            ...event,
            images: event.images.slice(0, 1) || [],
        }));
        res.status(200).json(events);
    } catch (error) {
        console.log("error in get event", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

eventRouter.get("/:eventId", optionalUserMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        let event;
        let wishlist: { id: string; userId: string }[] = [];

        if (req.userId) {
            event = await client.event.findUnique({
                where: { id: eventId, isDeleted: false },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    category: true,
                    description: true,
                    vip_ticket_price: true,
                    vip_tickets_count: true,
                    vip_tickets_sold: true,
                    general_ticket_price: true,
                    general_tickets_count: true,
                    general_tickets_sold: true,
                    date: true,
                    time_frame: true,
                    images: true,
                    location: {
                        select: { venue: true, city: true, country: true },
                    },
                    organizer_details: {
                        select: {
                            phone: true,
                            user: { select: { id: true, email: true } },
                        },
                    },
                    wishlist: {
                        where: { userId: req.userId },
                        select: { id: true, userId: true },
                    },
                },
            });

            wishlist = event?.wishlist ?? [];
        } else {
           
            event = await client.event.findUnique({
                where: { id: eventId, isDeleted: false },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    category: true,
                    description: true,
                    vip_ticket_price: true,
                    vip_tickets_count: true,
                    vip_tickets_sold: true,
                    general_ticket_price: true,
                    general_tickets_count: true,
                    general_tickets_sold: true,
                    date: true,
                    time_frame: true,
                    images: true,
                    location: {
                        select: { venue: true, city: true, country: true },
                    },
                    organizer_details: {
                        select: {
                            phone: true,
                            user: { select: { id: true, email: true } },
                        },
                    },
                },
            });

            wishlist = []; 
        }
        const heart = wishlist.length > 0;
        res.status(200).json({ event, heart });

    } catch (error) {
        console.log("error in get event", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



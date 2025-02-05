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
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../middleware/user");
const index_1 = __importDefault(require("../../../db/index"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const utils_1 = require("../../utils");
exports.userRouter = express_1.default.Router();
exports.userRouter.post("/wishlist/:eventId", user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside wishlist");
    const eventId = req.params.eventId;
    if (!req.userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const heart = req.body.heart;
    try {
        if (!heart) {
            const wishlist = yield index_1.default.wishlist.deleteMany({
                where: {
                    userId: req.userId,
                    eventId: eventId,
                },
            });
            res.json(wishlist);
        }
        else {
            const wishlist = yield index_1.default.wishlist.create({
                data: {
                    userId: req.userId,
                    eventId: eventId,
                },
            });
            res.json(wishlist);
        }
    }
    catch (error) {
        console.error("error occured in wishlist ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.userRouter.get("/wishlist", user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const category = req.query.category || "all";
    const status = req.query.status || "all";
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        let filter = {
            userId: req.userId,
        };
        if (category !== "all") {
            filter.event = { category };
        }
        if (status !== "all") {
            const currentDateTimeIST = moment_timezone_1.default
                .utc()
                .add(5, "hours")
                .add(30, "minutes")
                .format("YYYY-MM-DDTHH:mm:ss[Z]");
            if (!filter.event) {
                filter.event = {};
            }
            if (status === "active") {
                filter.event.date = { gte: currentDateTimeIST };
            }
            else if (status === "closed") {
                filter.event.date = { lt: currentDateTimeIST };
            }
        }
        const wishlist = yield index_1.default.wishlist.findMany({
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
                        general_ticket_price: true,
                    },
                },
            },
            take: limit,
            skip: skip,
        });
        const wishlistCount = yield index_1.default.wishlist.count({
            where: filter,
        });
        res.json({
            wishlist,
            wishlistCount,
        });
    }
    catch (error) {
        console.error("Error occurred in wishlist:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.userRouter.post("/event/publish", user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside publish event");
    if (!req.userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const isoDate = new Date(`${req.body.date}T${req.body.time_frame[0].time}Z`);
        const event = yield index_1.default.event.create({
            data: {
                title: req.body.title,
                type: req.body.type,
                category: req.body.category,
                description: req.body.description,
                vip_ticket_price: req.body.vip_ticket_price,
                vip_tickets_count: req.body.vip_tickets_count,
                vip_tickets_sold: 0,
                general_ticket_price: req.body.general_ticket_price,
                general_tickets_count: req.body.general_tickets_count,
                general_tickets_sold: 0,
                date: isoDate,
                time_frame: req.body.time_frame,
                images: req.body.images,
                creatorId: req.userId,
                location: {
                    create: req.body.location.map((loc) => ({
                        venue: loc.venue,
                        city: loc.city,
                        country: loc.country,
                    })),
                },
                organizer_details: {
                    create: req.body.organizer_details.map((organizer) => ({
                        phone: organizer.phone,
                        email: organizer.email,
                    })),
                },
            },
        });
        res.status(201).json({ eventId: event.id });
    }
    catch (error) {
        console.log("error in event", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.userRouter.get("/events", user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const status = req.query.status || "all";
    const category = req.query.category || "all";
    const title = req.query.title || "";
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const filter = {
            creatorId: req.userId
        };
        if (category !== "all") {
            filter.category = category;
        }
        if (title) {
            filter.title = {
                contains: title,
                mode: "insensitive"
            };
        }
        if (status !== "all") {
            const currentDateTimeIST = moment_timezone_1.default
                .utc()
                .add(5, "hours")
                .add(30, "minutes")
                .format("YYYY-MM-DDTHH:mm:ss[Z]");
            if (status === "active") {
                filter.date = { gte: currentDateTimeIST };
            }
            else if (status === "closed") {
                filter.date = { lt: currentDateTimeIST };
            }
        }
        const events = yield index_1.default.event.findMany({
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
                general_ticket_price: true,
                general_tickets_sold: true,
                general_tickets_count: true,
                vip_ticket_price: true,
                vip_tickets_sold: true,
                vip_tickets_count: true,
            },
            take: limit,
            skip: skip,
        });
        const total_events = yield index_1.default.event.count({
            where: filter
        });
        res.json({
            events,
            total_events,
        });
    }
    catch (error) {
        console.error("error occured in events ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.userRouter.get('/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.eventId;
    try {
        const event = yield index_1.default.event.findUnique({
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
                vip_ticket_price: true,
                vip_tickets_sold: true,
                vip_tickets_count: true,
                general_ticket_price: true,
                general_tickets_sold: true,
                general_tickets_count: true,
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
        });
        res.status(200).json(event);
    }
    catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.userRouter.put('/:eventId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Inside update');
    const eventId = req.params.eventId;
    try {
        let isoDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
            isoDate = new Date(`${req.body.date}T${req.body.time_frame[0].time}Z`);
        }
        else {
            const extractedDate = req.body.date.split("T")[0];
            isoDate = new Date(`${extractedDate}T${req.body.time_frame[0].time}Z`);
        }
        const event = yield index_1.default.event.update({
            where: {
                id: eventId,
                creatorId: req.userId
            },
            data: {
                title: req.body.title,
                type: req.body.type,
                category: req.body.category,
                description: req.body.description,
                vip_ticket_price: req.body.vip_ticket_price,
                vip_tickets_count: req.body.vip_tickets_count,
                general_ticket_price: req.body.general_ticket_price,
                general_tickets_count: req.body.general_tickets_count,
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
                },
            }
        });
        res.status(200).json({ eventId: event.id });
    }
    catch (error) {
        console.log('Error in update event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.userRouter.delete('/:eventId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.eventId;
    try {
        const event = yield index_1.default.event.delete({
            where: {
                id: eventId,
                creatorId: req.userId
            }
        });
        res.json({ eventId: event.id });
    }
    catch (error) {
        console.log('error in delete event', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.userRouter.get('/profile/data', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside profile');
    try {
        const user = yield index_1.default.user.findUnique({
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
        });
        res.json(user);
    }
    catch (error) {
        console.log('error in get profile', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.userRouter.put('/profile/data', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield index_1.default.user.update({
            where: {
                id: req.userId
            },
            data: {
                phone: req.body.phone,
                bio: req.body.bio,
                linkedIn: req.body.linkedIn,
                twitter: req.body.twitter,
                newsletter_subscription: req.body.newsletter_subscription
            }
        });
        res.json({
            userId: user.id
        });
    }
    catch (error) {
        console.log('error in update profile', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.userRouter.post('/profile/update/password', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield index_1.default.user.findUnique({
            where: {
                id: req.userId
            }
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (req.body.current_password) {
            const isValid = bcrypt_1.default.compareSync(req.body.current_password, user.password);
            if (!isValid) {
                res.status(401).json({ message: 'Invalid current password' });
                return;
            }
        }
        // update with req.body.new_password
        const saltRounds = 10;
        const salt = bcrypt_1.default.genSaltSync(saltRounds);
        const hashedPassword = bcrypt_1.default.hashSync(req.body.new_password, salt);
        const userUpdate = yield index_1.default.user.update({
            where: {
                id: req.userId
            },
            data: {
                password: hashedPassword
            }
        });
        res.json({ userId: userUpdate.id });
    }
    catch (error) {
        console.log('error in update password', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.userRouter.post('/ticket/transaction/:eventId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Inside transaction');
    const eventId = req.params.eventId;
    try {
        const transactionData = yield index_1.default.$transaction((client) => __awaiter(void 0, void 0, void 0, function* () {
            const event = yield client.event.findUnique({
                where: { id: eventId },
            });
            if (!event) {
                throw new Error('Event not found');
            }
            // Determine available tickets based on category
            let availableTickets, ticketsSoldField;
            if (req.body.ticket_category === 'VIP Access') {
                if (event.vip_tickets_count === -1) {
                    availableTickets = Infinity; // Unlimited tickets
                }
                else {
                    availableTickets = event.vip_tickets_count - event.vip_tickets_sold;
                }
                ticketsSoldField = 'vip_tickets_sold';
            }
            else if (req.body.ticket_category === 'General Admission') {
                if (event.general_tickets_count === -1) {
                    availableTickets = Infinity; // Unlimited tickets
                }
                else {
                    availableTickets = event.general_tickets_count - event.general_tickets_sold;
                }
                ticketsSoldField = 'general_tickets_sold';
            }
            else {
                throw new Error('Invalid ticket category');
            }
            // Skip availability check if unlimited tickets
            if (availableTickets !== Infinity && availableTickets < req.body.ticket_quantity) {
                throw new Error('Not enough tickets available');
            }
            // Update ticket count
            yield client.event.update({
                where: { id: eventId },
                data: {
                    [ticketsSoldField]: {
                        increment: req.body.ticket_quantity,
                    },
                },
            });
            // Create transaction
            const transaction = yield client.transaction.create({
                data: {
                    userId: req.userId,
                    eventId: eventId,
                    amount: req.body.ticket_amount,
                    ticket_details: {
                        create: [
                            {
                                ticket_quantity: req.body.ticket_quantity,
                                ticket_category: req.body.ticket_category,
                                ticket_price: req.body.ticket_price,
                                payment_type: req.body.payment_type,
                                attendees: {
                                    create: req.body.attendees.map((attendee) => ({
                                        name: attendee.name,
                                        age: attendee.age,
                                    })),
                                },
                            },
                        ],
                    },
                },
            });
            return transaction;
        }));
        res.status(201).json({
            transactionId: transactionData.id,
        });
    }
    catch (error) {
        console.error('Transaction error:', error.message);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}));
exports.userRouter.get('/ticket/:transactionId', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield index_1.default.transaction.findUnique({
            where: {
                id: req.params.transactionId
            },
            select: {
                id: true,
                amount: true,
                event: {
                    select: {
                        title: true,
                        date: true,
                        time_frame: true,
                        location: {
                            select: {
                                venue: true,
                                city: true,
                                country: true,
                            }
                        }
                    }
                },
                ticket_details: {
                    select: {
                        attendees: {
                            select: {
                                name: true,
                                age: true
                            }
                        }
                    }
                }
            }
        });
        if (!transaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        res.json({
            transactionId: transaction.id,
            amount: transaction.amount,
            event_details: transaction.event,
            ticket_details: transaction.ticket_details[0],
        });
    }
    catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.userRouter.get('/transactions/bulk', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('inside bulk transactions');
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const filters = {
        userId: req.userId
    };
    // Filter by Title (if provided)
    if (req.query.title && req.query.title !== "") {
        filters.transactions = {
            some: {
                event: {
                    title: {
                        contains: req.query.title,
                        mode: 'insensitive'
                    }
                }
            }
        };
    }
    // Filter by Type (if provided and not "all")
    if (req.query.type && req.query.type !== "all") {
        filters.transactions = {
            some: {
                event: {
                    type: req.query.type
                }
            }
        };
    }
    // Filter by Date Range (if provided and not "all")
    if (req.query.dateRange && req.query.dateRange !== "all") {
        const today = new Date();
        let startDate;
        switch (req.query.dateRange) {
            case "30":
                startDate = new Date(today.setDate(today.getDate() - 30));
                break;
            case "90":
                startDate = new Date(today.setDate(today.getDate() - 90));
                break;
            case "365":
                startDate = new Date(today.setDate(today.getDate() - 365));
                break;
            default:
                startDate = null;
        }
        if (startDate) {
            filters.transactions = {
                some: {
                    created_at: {
                        gte: startDate
                    }
                }
            };
        }
    }
    if (req.query.status && req.query.status !== "all") {
        const currentDateTimeIST = moment_timezone_1.default
            .utc()
            .add(5, "hours")
            .add(30, "minutes")
            .format("YYYY-MM-DDTHH:mm:ss[Z]");
        // Ensure filters.transaction is always structured properly
        if (!filters.transactions) {
            filters.transactions = { some: { event: {} } };
        }
        else if (!filters.transactions.some) {
            filters.transactions.some = { event: {} };
        }
        if (req.query.status === "active") {
            filters.transactions.some.event.date = { gte: currentDateTimeIST };
        }
        else if (req.query.status === "closed") {
            filters.transactions.some.event.date = { lt: currentDateTimeIST };
        }
    }
    try {
        const transactions = yield index_1.default.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                _count: {
                    select: {
                        transactions: true,
                    },
                },
                transactions: {
                    where: ((_a = filters.transactions) === null || _a === void 0 ? void 0 : _a.some) || {},
                    select: {
                        id: true,
                        eventId: true,
                        created_at: true,
                        amount: true,
                        event: {
                            select: {
                                id: true,
                                title: true,
                                category: true,
                                date: true,
                                time_frame: true,
                                location: {
                                    select: {
                                        venue: true,
                                        city: true,
                                        country: true,
                                    }
                                },
                            }
                        },
                        ticket_details: {
                            select: {
                                ticket_category: true,
                                ticket_quantity: true,
                                ticket_price: true,
                                attendees: {
                                    select: {
                                        name: true,
                                        age: true
                                    }
                                },
                                payment_type: true,
                            }
                        }
                    },
                    skip: skip,
                    take: limit,
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            }
        });
        const total_transactions = (transactions === null || transactions === void 0 ? void 0 : transactions._count.transactions) || 0;
        res.json({
            total_transactions,
            transactions: transactions === null || transactions === void 0 ? void 0 : transactions.transactions
        });
    }
    catch (error) {
        console.log('Error occured while fetching transactions');
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.userRouter.get('/dashboard/analytics', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside analytics');
    try {
        const result = yield index_1.default.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                events: {
                    select: {
                        title: true,
                        vip_ticket_price: true,
                        vip_tickets_sold: true,
                        vip_tickets_count: true,
                        general_ticket_price: true,
                        general_tickets_sold: true,
                        general_tickets_count: true,
                        date: true,
                        transactions: {
                            select: {
                                amount: true,
                                created_at: true,
                                ticket_details: {
                                    select: {
                                        ticket_category: true,
                                        payment_type: true,
                                        attendees: {
                                            select: {
                                                age: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!result) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Metrics
        let totalRevenue = 0;
        let totalTicketsSold = 0;
        result.events.forEach(event => {
            const eventTotalTicketsSold = (event.vip_tickets_sold || 0) + (event.general_tickets_sold || 0);
            totalTicketsSold += eventTotalTicketsSold;
            event.transactions.forEach(txn => {
                totalRevenue += txn.amount || 0;
            });
        });
        const avgTicketPrice = totalTicketsSold > 0 ? (totalRevenue / totalTicketsSold).toFixed(2) : "0.00";
        // Intialize age categories
        let ageDistribution = {
            '<15 age': 0,
            '15-29 age': 0,
            '30-44 age': 0,
            '45-59 age': 0,
            '60-74 age': 0,
            '75-89 age': 0,
            '90+ age': 0
        };
        result.events.forEach(event => {
            event.transactions.forEach(txn => {
                txn.ticket_details[0].attendees.forEach(attendee => {
                    const category = (0, utils_1.categorizeAge)(attendee.age);
                    ageDistribution[category]++;
                });
            });
        });
        // Top 3 performing events
        let topEvents = result.events.map(event => {
            const eventTotalTicketsSold = (event.vip_tickets_sold || 0) + (event.general_tickets_sold || 0);
            const totalRevenue = event.transactions.reduce((sum, txn) => sum + txn.amount, 0);
            const totalAvailableTickets = (event.vip_tickets_count || 0) + (event.general_tickets_count || 0);
            const conversionRate = totalAvailableTickets > 0
                ? ((eventTotalTicketsSold / totalAvailableTickets) * 100).toFixed(2) + "%"
                : "N/A";
            return {
                title: event.title,
                revenue: totalRevenue,
                ticketsSold: eventTotalTicketsSold,
                conversionRate,
                status: event.date // Convert Date object to readable format
            };
        });
        // Sort by revenue in descending order and take the top 3
        topEvents = topEvents.sort((a, b) => b.revenue - a.revenue).slice(0, 3);
        res.status(200).json({
            metrics: {
                totalRevenue,
                totalTicketsSold,
                avgTicketPrice,
            },
            topEvents: topEvents,
            ageDistribution
        });
    }
    catch (error) {
        console.error('Error occurred while fetching analytics:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.userRouter.get('/dashboard/overview', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Inside overview');
    try {
        const result = yield index_1.default.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                events: {
                    select: {
                        title: true,
                        vip_ticket_price: true,
                        vip_tickets_sold: true,
                        vip_tickets_count: true,
                        general_ticket_price: true,
                        general_tickets_sold: true,
                        general_tickets_count: true,
                        transactions: {
                            select: {
                                amount: true,
                            }
                        }
                    }
                }
            }
        });
        if (!result) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Metrics
        const totalEvents = result.events.length;
        const totalRevenue = result.events.reduce((sum, event) => {
            const eventRevenue = event.transactions.reduce((revenueSum, tx) => revenueSum + (tx.amount || 0), 0);
            return sum + eventRevenue;
        }, 0);
        const totalTicketsSold = result.events.reduce((sum, event) => sum + ((event.vip_tickets_sold || 0) + (event.general_tickets_sold || 0)), 0);
        const totalTickets = result.events.reduce((sum, event) => sum + ((event.vip_tickets_count || 0) + (event.general_tickets_count || 0)), 0);
        const conversionRate = totalTickets > 0 ? ((totalTicketsSold / totalTickets) * 100).toFixed(2) : "0.00";
        const metrics = {
            totalEvents,
            totalRevenue,
            totalTicketsSold,
            conversionRate
        };
        // Top 3 upcoming events
        const currentDateTimeIST = moment_timezone_1.default
            .utc()
            .add(5, "hours")
            .add(30, "minutes")
            .format("YYYY-MM-DDTHH:mm:ss[Z]");
        const fetched_events = yield index_1.default.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                events: {
                    where: {
                        date: {
                            gte: currentDateTimeIST,
                        },
                    },
                    orderBy: {
                        date: "asc",
                    },
                    take: 3,
                    select: {
                        title: true,
                        date: true,
                        location: {
                            select: {
                                venue: true,
                                city: true,
                                country: true,
                            }
                        },
                        time_frame: true,
                        general_tickets_sold: true,
                        vip_tickets_sold: true
                    }
                }
            }
        });
        const upcomingEvents = fetched_events ? fetched_events.events.map(event => {
            var _a, _b, _c;
            return ({
                title: event.title,
                date: event.date, // Keeping this as is
                location: `${(_a = event.location[0]) === null || _a === void 0 ? void 0 : _a.venue}, ${(_b = event.location[0]) === null || _b === void 0 ? void 0 : _b.city}, ${(_c = event.location[0]) === null || _c === void 0 ? void 0 : _c.country}`,
                time: event.time_frame,
                ticketsSold: (event.vip_tickets_sold || 0) + (event.general_tickets_sold || 0),
            });
        }) : [];
        res.status(200).json({
            metrics,
            upcomingEvents
        });
    }
    catch (error) {
        console.error('Error occurred while fetching overview:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.userRouter.get('/dashboard/overview/recent-activity', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside recent activity');
    try {
        const activity = yield index_1.default.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                transactions: {
                    select: {
                        event: {
                            select: {
                                title: true,
                            }
                        },
                        ticket_details: {
                            select: {
                                ticket_quantity: true,
                            }
                        },
                        created_at: true
                    },
                    take: 5,
                    orderBy: { created_at: 'desc' }
                },
                events: {
                    select: {
                        title: true,
                        updated_at: true,
                        created_at: true,
                    },
                    take: 5,
                    orderBy: { updated_at: 'desc' },
                }
            }
        });
        res.json(activity);
    }
    catch (error) {
        console.log('Error occurred while fetching recent activity');
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}));

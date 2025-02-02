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
                price: true,
                total_tickets: true,
                tickets_sold: true,
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
                        price: true,
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
exports.userRouter.post('/update/password', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    console.log('inside transaction');
    if (!req.userId || typeof req.userId !== 'string') {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const ticket_transaction = yield index_1.default.$transaction((client) => __awaiter(void 0, void 0, void 0, function* () {
            const event = yield client.event.findUnique({
                where: {
                    id: req.params.eventId,
                },
            });
            if (!event) {
                res.status(404).json({ message: 'Event not found' });
                return;
            }
            if (event.total_tickets === null || event.total_tickets - event.tickets_sold >= req.body.ticket_quantity) {
                yield client.event.update({
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
                const transaction = yield client.transaction.create({
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
                res.status(201).json({
                    transactionId: transaction.id,
                });
            }
            else {
                res.status(400).json({ message: 'Not enough tickets available' });
            }
        }));
    }
    catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Internal server error' });
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
                ticket_details: {
                    select: {
                        event_title: true,
                        event_date: true,
                        event_venue: true,
                        event_time: true,
                        attendee: {
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
            ticket_details: transaction.ticket_details[0],
        });
    }
    catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.userRouter.get('/transactions/bulk', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside bulk transactions');
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const transactions = yield index_1.default.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                _count: {
                    select: {
                        transaction: true,
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        eventId: true,
                        created_at: true,
                        amount: true,
                        ticket_details: {
                            select: {
                                ticket_category: true,
                                ticket_quantity: true,
                                ticket_price: true,
                                attendee: {
                                    select: {
                                        name: true,
                                        age: true
                                    }
                                },
                                payment_type: true,
                                event_title: true,
                                event_category: true,
                                event_date: true,
                                event_venue: true,
                                event_time: true,
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
        const total_transactions = (transactions === null || transactions === void 0 ? void 0 : transactions._count.transaction) || 0;
        res.json({
            total_transactions,
            transactions: transactions === null || transactions === void 0 ? void 0 : transactions.transaction
        });
    }
    catch (error) {
        console.log('Error occured while fetching transactions');
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

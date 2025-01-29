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
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const events = yield index_1.default.event.findMany({
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
        const total_events = yield index_1.default.event.count({
            where: {
                creatorId: req.userId,
            },
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
    const limit = 6;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const wishlist = yield index_1.default.wishlist.findMany({
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
        });
        const wishlistCount = yield index_1.default.wishlist.count({
            where: {
                userId: req.userId
            }
        });
        res.json({
            wishlist,
            wishlistCount
        });
    }
    catch (error) {
        console.error("error occured in wishlist ", error);
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
            isoDate = req.body.date;
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
                tickets_sold: '0',
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

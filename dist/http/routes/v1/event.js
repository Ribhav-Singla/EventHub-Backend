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
exports.eventRouter = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../middleware/user");
const index_1 = __importDefault(require("../../../db/index"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
exports.eventRouter = express_1.default.Router();
exports.eventRouter.post('/', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside event');
    try {
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const isoDate = new Date(`${req.body.date}T${req.body.time_frame[0].time}Z`);
        const event = yield index_1.default.event.create({
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
                            venue: req.body.location.venu,
                            city: req.body.location.city,
                            country: req.body.location.country
                        }]
                },
                organizer_details: {
                    create: [{
                            phone: req.body.organizer_details.phone,
                            email: req.body.organizer_details.email
                        }]
                }
            }
        });
        res.status(201).json({ eventId: event.id });
    }
    catch (error) {
        console.log('error in event', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.eventRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = 9;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const fetched_events = yield index_1.default.event.findMany({
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
        });
        const total_events = yield index_1.default.event.count();
        const events = fetched_events.map(event => (Object.assign(Object.assign({}, event), { images: event.images.slice(0, 1) || [] })));
        res.status(200).json({
            events,
            total_events
        });
    }
    catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.eventRouter.get('/upcoming', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = Number(req.query.limit) | 1;
    try {
        const currentDateTimeIST = moment_timezone_1.default.utc().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const fetched_events = yield index_1.default.event.findMany({
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
        });
        const events = fetched_events.map(event => (Object.assign(Object.assign({}, event), { images: event.images.slice(0, 1) || [] })));
        res.status(200).json(events);
    }
    catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.eventRouter.get('/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.eventId;
    try {
        const events = yield index_1.default.event.findUnique({
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
                }
            }
        });
        res.status(200).json(events);
    }
    catch (error) {
        console.log('error in get event', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));

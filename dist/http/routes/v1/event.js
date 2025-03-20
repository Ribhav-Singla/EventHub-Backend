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
const index_1 = __importDefault(require("../../../db/index"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
exports.eventRouter = express_1.default.Router();
exports.eventRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.query);
    const limit = 9;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    try {
        const filters = {
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
        const extractArray = (param) => {
            if (!param)
                return [];
            if (Array.isArray(param))
                return param.filter((item) => typeof item === "string");
            if (typeof param === "string")
                return [param];
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
            if (typeof req.query.min_price === "string" &&
                !isNaN(Number(req.query.min_price))) {
                filters.general_ticket_price.gte = Number(req.query.min_price);
            }
            if (typeof req.query.max_price === "string" &&
                !isNaN(Number(req.query.max_price))) {
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
        console.log("Generated Filters:", filters); // Debugging
        // Fetch events with filters
        const fetched_events = yield index_1.default.event.findMany({
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
        const total_events = yield index_1.default.event.count({
            where: Object.keys(filters).length > 0 ? filters : undefined,
        });
        // Return only the first image per event
        const events = fetched_events.map((event) => (Object.assign(Object.assign({}, event), { images: event.images.length > 0 ? [event.images[0]] : [] })));
        res.status(200).json({
            events,
            total_events,
        });
    }
    catch (error) {
        console.log("Error in get events", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.eventRouter.get("/upcoming", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = Number(req.query.limit) | 1;
    try {
        const currentDateTimeIST = moment_timezone_1.default
            .utc()
            .add(5, "hours")
            .add(30, "minutes")
            .format("YYYY-MM-DDTHH:mm:ss[Z]");
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
                    },
                },
                general_ticket_price: true,
                time_frame: true,
            },
            where: {
                date: {
                    gte: currentDateTimeIST,
                },
            },
            orderBy: [{ date: "asc" }],
            take: limit,
        });
        const events = fetched_events.map((event) => (Object.assign(Object.assign({}, event), { images: event.images.slice(0, 1) || [] })));
        res.status(200).json(events);
    }
    catch (error) {
        console.log("error in get event", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.eventRouter.get("/:eventId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.eventId;
    try {
        const event = yield index_1.default.event.findUnique({
            where: {
                id: eventId,
            },
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
                    select: {
                        venue: true,
                        city: true,
                        country: true,
                    },
                },
                organizer_details: {
                    select: {
                        phone: true,
                        user: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    },
                },
                wishlist: {
                    where: {
                        userId: req.userId,
                    },
                    select: {
                        id: true,
                    },
                },
            },
        });
        let heart = false;
        if (event && event.wishlist && event.wishlist.length > 0) {
            heart = true;
        }
        res.status(200).json({
            event,
            heart,
        });
    }
    catch (error) {
        console.log("error in get event", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));

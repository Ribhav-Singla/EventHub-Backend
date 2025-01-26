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

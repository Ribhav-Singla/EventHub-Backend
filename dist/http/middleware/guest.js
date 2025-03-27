"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const guestId = process.env.GUEST_ID;
const restrictGuestActions = (req, res, next) => {
    if (req.userId === guestId && (req.method === "PUT" || req.method === "DELETE")) {
        return res.status(403).json({ message: "Guests are not allowed to modify data." });
    }
    next();
};

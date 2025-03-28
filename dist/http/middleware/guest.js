"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictGuestActions = void 0;
const guestId = process.env.GUEST_ID;
const restrictGuestActions = (req, res, next) => {
    if (req.userId === guestId && (req.method === "PUT" || req.method === "DELETE" || req.method === "POST")) {
        res.status(403).json({ message: "Guests are not allowed to modify data." });
        return;
    }
    next();
};
exports.restrictGuestActions = restrictGuestActions;

import { NextFunction, Request, Response } from "express";

const guestId = process.env.GUEST_ID;

const restrictGuestActions = (req: Request, res: Response, next: NextFunction) => {
    if (req.userId === guestId && (req.method === "PUT" || req.method === "DELETE")) {
        return res.status(403).json({ message: "Guests are not allowed to modify data." });
    }
    next();
};

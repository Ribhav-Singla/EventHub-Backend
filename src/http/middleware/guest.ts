import { NextFunction, Request, Response } from "express";

const guestId = process.env.GUEST_ID;

export const restrictGuestActions = (req: Request, res: Response, next: NextFunction) => {
    if (req.userId === guestId && (req.method === "PUT" || req.method === "DELETE" || req.method === "POST")) {
        res.status(403).json({ message: "Guests are not allowed to modify data." });
        return ;
    }
    next();
};

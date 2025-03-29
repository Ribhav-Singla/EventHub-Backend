"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = exports.organizerDetailsSchema = exports.locationSchema = exports.timeFrameSchema = exports.profileSchema = exports.sendMessageScehma = exports.newsletterScehma = exports.forgotPasswordScehma = exports.loginSchema = exports.signinSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.signinSchema = zod_1.default.object({
    firstname: zod_1.default.string(),
    lastname: zod_1.default.string(),
    email: zod_1.default.string(),
    password: zod_1.default.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/, "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.")
});
exports.loginSchema = zod_1.default.object({
    email: zod_1.default.string(),
    password: zod_1.default.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/, "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.")
});
exports.forgotPasswordScehma = zod_1.default.object({
    email: zod_1.default.string(),
    new_password: zod_1.default.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/, "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.")
});
exports.newsletterScehma = zod_1.default.object({
    email: zod_1.default.string()
});
exports.sendMessageScehma = zod_1.default.object({
    receiverId: zod_1.default.string(),
    text: zod_1.default.string()
});
exports.profileSchema = zod_1.default.object({
    phone: zod_1.default.string().optional(),
    bio: zod_1.default.string().optional(),
    linkedIn: zod_1.default.string().optional(),
    twitter: zod_1.default.string().optional(),
    newsletter_subscription: zod_1.default.boolean()
});
exports.timeFrameSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, "Title is required"),
    description: zod_1.default.string().min(1, "Description is required"),
    time: zod_1.default.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
});
exports.locationSchema = zod_1.default.object({
    venue: zod_1.default.string().min(1, "Venue is required"),
    city: zod_1.default.string().min(1, "City is required"),
    country: zod_1.default.enum([
        "Australia", "Canada", "China", "France", "Germany",
        "India", "Japan", "N/A", "South Korea",
        "United Kingdom", "United States"
    ], { message: "Invalid country selection" })
});
exports.organizerDetailsSchema = zod_1.default.object({
    phone: zod_1.default.string().regex(/^\d{10,15}$/, "Invalid phone number"),
    user: zod_1.default.object({
        email: zod_1.default.string().email("Invalid email"),
    }),
});
exports.eventSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, "Title is required"),
    type: zod_1.default.enum([
        "Conference", "Workshop", "Seminar", "Networking", "Webinar",
        "Meetup", "Hackathon", "Training", "Panel Discussion", "Exhibition"
    ], { message: "Invalid event type" }),
    category: zod_1.default.enum([
        "Art", "Business", "Education", "Health", "Music",
        "Science", "Sports", "Technology", "Travel", "Wellness"
    ], { message: "Invalid category" }),
    description: zod_1.default.string().min(1, "Description is required"),
    vip_ticket_price: zod_1.default.number().min(0, "VIP ticket price must be at least 0"),
    vip_tickets_count: zod_1.default.number().min(-1, "VIP ticket count must be at least -1"),
    general_ticket_price: zod_1.default.number().min(0, "General ticket price must be at least 0"),
    general_tickets_count: zod_1.default.number().min(-1, "General ticket count must be at least -1"),
    date: zod_1.default.string(),
    time_frame: zod_1.default.array(exports.timeFrameSchema).nonempty("At least one time frame is required"),
    location: zod_1.default.array(exports.locationSchema).nonempty("At least one location is required"),
    images: zod_1.default.array(zod_1.default.string()).optional(),
    organizer_details: zod_1.default.array(exports.organizerDetailsSchema).nonempty("At least one organizer is required"),
});

import z from 'zod';

export const signinSchema = z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string(),
    password: z.string().regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character."
    )
})

export const loginSchema = z.object({
    email: z.string(),
    password: z.string().regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character."
    )
})

export const forgotPasswordScehma = z.object({
    email: z.string(),
    new_password: z.string().regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character."
    )
})

export const newsletterScehma = z.object({
    email: z.string()
})

export const sendMessageScehma = z.object({
    receiverId : z.string(),
    text : z.string()
})

export const profileSchema = z.object({
    phone: z.string().optional(),
    bio: z.string().optional(),
    linkedIn: z.string().optional(),
    twitter: z.string().optional(),
    newsletter_subscription: z.boolean()
})

export const timeFrameSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
});

export const locationSchema = z.object({
    venue: z.string().min(1, "Venue is required"),
    city: z.string().min(1, "City is required"),
    country: z.enum([
        "Australia", "Canada", "China", "France", "Germany", 
        "India", "Japan", "N/A", "South Korea", 
        "United Kingdom", "United States"
    ], { message: "Invalid country selection" })
});

export const organizerDetailsSchema = z.object({
    phone: z.string().regex(/^\d{10,15}$/, "Invalid phone number"),
    user: z.object({
        email: z.string().email("Invalid email"),
    }),
});

export const eventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum([
        "Conference", "Workshop", "Seminar", "Networking", "Webinar",
        "Meetup", "Hackathon", "Training", "Panel Discussion", "Exhibition"
    ], { message: "Invalid event type" }),
    category: z.enum([
        "Art", "Business", "Education", "Health", "Music",
        "Science", "Sports", "Technology", "Travel", "Wellness"
    ], { message: "Invalid category" }),
    description: z.string().min(1, "Description is required"),
    vip_ticket_price: z.number().min(0, "VIP ticket price must be at least 0"),
    vip_tickets_count: z.number().min(0, "VIP ticket count must be at least 0"),
    general_ticket_price: z.number().min(0, "General ticket price must be at least 0"),
    general_tickets_count: z.number().min(0, "General ticket count must be at least 0"),
    date: z.string(),
    time_frame: z.array(timeFrameSchema).nonempty("At least one time frame is required"),
    location: z.array(locationSchema).nonempty("At least one location is required"),
    images: z.array(z.string()).optional(),
    organizer_details: z.array(organizerDetailsSchema).nonempty("At least one organizer is required"),
});

export interface LOCATION_TYPE {
    venue: string;
    city: string;
    country: string;
}

export interface ORGANIZER_DETAILS_TYPE {
    phone: string;
    email: string;
}
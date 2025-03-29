import express from 'express'
import bcrypt from 'bcrypt'
import client from '../../../db/index'
import jwt from 'jsonwebtoken'
import { JWT_PASSWORD } from '../../config'
import { userMiddleware } from '../../middleware/user'
import { imageRouter } from '../../upload'
import { eventRouter } from './event'
import { userRouter } from './user'
import { oauth2client } from '../../googleConfig'
import { google } from 'googleapis';
import nodemailer from 'nodemailer'
import cron from 'node-cron';
import { chatRouter } from './chat'
import { restrictGuestActions } from '../../middleware/guest'
import { forgotPasswordScehma, loginSchema, newsletterScehma, signinSchema } from '../../types'

export const router = express.Router()

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.get('/', async (req, res) => {
    res.send('Healthy Server')
})

router.post('/signup', async (req, res) => {
    console.log('inside signup');

    const { success, error } = signinSchema.safeParse(req.body)
    if (error) {
        res.status(400).json({ error: 'Invalid Request.' })
        return;
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds)
    const hashedPassword = bcrypt.hashSync(req.body.password, salt)

    try {
        const user = await client.user.create({
            data: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                password: hashedPassword,
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: '',
            token: token
        })
    } catch (error) {
        console.log('error thrown in signup');
        console.log(error);
        res.status(400).json({
            message: "Email already exists"
        })
    }
})

router.post('/login', async (req, res) => {
    console.log('inside login');

    const {success,error} = loginSchema.safeParse(req.body)
    if(error){
        res.status(400).json({error: 'Invalid Request.'})
        return;
    }

    try {
        const user = await client.user.findUnique({
            where: {
                email: req.body.email
            }
        })
        if (!user) {
            res.status(401).json({
                message: "Invalid email"
            })
            return
        }
        const isValid = bcrypt.compareSync(req.body.password, user.password)
        if (!isValid) {
            res.status(401).json({
                message: "Invalid password"
            })
            return
        }

        // check if the user is guest or not
        let token = '';
        if (user.email === process.env.GUEST_EMAIL) {
            token = jwt.sign({
                userId: user.id
            }, JWT_PASSWORD, { expiresIn: '1h' });
        } else {
            token = jwt.sign({
                userId: user.id
            }, JWT_PASSWORD);
        }

        res.json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: '',
            token: token
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/google_auth/signup', async (req, res) => {
    console.log('inside google authentication');

    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ message: 'Authorization code is required and must be a string.' });
            return
        }

        const google_response = await oauth2client.getToken(code);
        oauth2client.setCredentials(google_response.tokens);

        const oauth2 = google.oauth2({
            auth: oauth2client,
            version: 'v2',
        })
        const user_response = await oauth2.userinfo.get();
        const { email, given_name, family_name, picture } = user_response.data;

        const user = await client.user.create({
            data: {
                firstname: given_name || '',
                lastname: family_name || '',
                email: email || '',
                password: ''
            }
        })

        if (!user) {
            res.status(400).json({ message: 'Email already exists' })
            return
        }

        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: picture,
            token: token
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/google_auth/login', async (req, res) => {
    console.log('inside google authentication login');

    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ message: 'Authorization code is required and must be a string.' });
            return
        }

        const google_response = await oauth2client.getToken(code);
        oauth2client.setCredentials(google_response.tokens);

        const oauth2 = google.oauth2({
            auth: oauth2client,
            version: 'v2',
        })
        const user_response = await oauth2.userinfo.get();
        const { email, given_name, family_name, picture } = user_response.data;

        const user = await client.user.findUnique({
            where: {
                email: email || ''
            }
        })

        if (!user) {
            res.status(400).json({ message: 'Email not found!' })
            return
        }

        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
            id: user.id,
            firstname: given_name || user.firstname,
            lastname: family_name || user.lastname,
            email: email || user.email,
            avatar: picture,
            token: token
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/me', userMiddleware, async (req, res) => {
    console.log('inside me');
    const userId = req.userId;
    try {
        const user = await client.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            res.status(400).json({ message: "User not found" })
            return
        }
        res.json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: ''
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/forgotpassword', async (req, res) => {

    const {success,error} = forgotPasswordScehma.safeParse(req.body)
    
    if(error){
        res.status(400).json({ message: "Invalid request" })
        return ;
    }

    try {
        const user = await client.user.findUnique({
            where: {
                email: req.body.email
            }
        })

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return
        }

        // update with req.body.new_password
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds)
        const hashedPassword = bcrypt.hashSync(req.body.new_password, salt)
        const userUpdate = await client.user.update({
            where: {
                email: req.body.email
            },
            data: {
                password: hashedPassword
            }
        })
        res.json({ userId: userUpdate.id })
    } catch (error) {
        console.log('error in update password', error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

router.post('/newsletter', async (req, res) => {

    const {success,error} = newsletterScehma.safeParse(req.body)
    if(error){
        res.status(400).json({ message: "Invalid request" })
        return ;
    }

    const { email } = req.body;
    try {
        const user = await client.user.update({
            where: {
                email: email
            },
            data: {
                newsletter_subscription: true,
            }
        })
        if (!user) {
            res.status(400).json({ message: "User not found" })
        }
        res.json({ message: "Newsletter subscription successful" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

async function sendNewsletter() {
    try {
        // Fetch users who have subscribed to the newsletter
        const subscribers = await client.user.findMany({
            where: { newsletter_subscription: true },
            select: { id: true, email: true, firstname: true },
        });

        // Fetch new events created in the last 24 hours
        const newEvents = await client.event.findMany({
            where: {
                created_at: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Events from the last 24 hours
                },
            },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                location: {
                    select: {
                        venue: true,
                        city: true,
                        country: true,
                    },
                },
            },
        });

        if (newEvents.length === 0) {
            console.log('No new events to share.');
            return;
        }

        // Prepare and send emails
        for (const subscriber of subscribers) {
            const eventDetails = newEvents
                .map((event: {
                    location: {
                        venue: string;
                        city: string;
                        country: string;
                    }[];
                    id: string;
                    title: string;
                    description: string;
                    date: Date;
                }) => {
                    const { venue, city, country } = event.location[0];
                    return `
              <h3>${event.title}</h3>
              <p>${event.description}</p>
              <p>Date: ${event.date.toDateString()}</p>
              <p>Location: ${venue}, ${city}, ${country}</p>
              <hr/>
            `;
                })
                .join('');

            const mailOptions = {
                from: '"Event Updates" <no-reply@example.com>',
                to: subscriber.email,
                subject: '📅 New Events You Might Like!',
                html: `
            <p>Hello ${subscriber.firstname},</p>
            <p>Here are the latest events:</p>
            ${eventDetails}
            <p>Stay tuned for more updates!</p>
          `,
            };

            await transporter.sendMail(mailOptions);
            console.log(`Newsletter sent to ${subscriber.email}`);
        }
    } catch (error) {
        console.error('Error sending newsletters:', error);
    } finally {
        await client.$disconnect();
    }
}

// Schedule task to run once a day at 9:00 AM
cron.schedule('0 9 * * *', () => {
    console.log('📅 Sending daily newsletter...');
    sendNewsletter();
});

router.use('/upload_images', imageRouter)
router.use('/event', eventRouter)
router.use('/user', userRouter)
router.use('/chat', chatRouter)
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

export const router = express.Router()

router.get('/', async (req, res) => {
    res.send('Healthy Server')
})

router.post('/signup', async (req, res) => {
    console.log('inside signup');
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
        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
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
            data:{
                firstname: given_name || '',
                lastname: family_name || '',
                email: email || '',
                password: ''
            }
        })

        if(!user){
            res.status(400).json({ message: 'Email already exists' })
            return
        }

        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
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

        if(!user){
            res.status(400).json({ message: 'Email not found!' })
            return
        }

        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
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
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: ''
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

router.use('/upload_images', imageRouter)
router.use('/event', eventRouter)
router.use('/user', userRouter)
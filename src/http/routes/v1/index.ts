import express from 'express'
import bcrypt from 'bcrypt'
import client from '../../../db/index'
import jwt from 'jsonwebtoken'
import { JWT_PASSWORD } from '../../config'
import { userMiddleware } from '../../middleware/user'
import { imageRouter } from '../../upload'
import { eventRouter } from './event'

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
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_PASSWORD);

        res.json({
            username: user.username,
            email: user.email,
            avatar: 'https://masterpiecer-images.s3.yandex.net/aa6c93406ba911ee90bd7a2f0d1382ba:upscaled',
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
            username: user.username,
            email: user.email,
            avatar: 'https://masterpiecer-images.s3.yandex.net/aa6c93406ba911ee90bd7a2f0d1382ba:upscaled',
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
            username: user.username,
            email: user.email,
            avatar: 'https://masterpiecer-images.s3.yandex.net/aa6c93406ba911ee90bd7a2f0d1382ba:upscaled'
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

router.use('/upload_images', imageRouter)
router.use('/event', eventRouter)
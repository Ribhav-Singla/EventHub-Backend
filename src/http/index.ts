import express from 'express'
import { router } from './routes/v1'
import cors from 'cors'

const app = express()
const corsOptions = {
    origin: '*',
    methods: ["GET", "POST","DELETE","PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
const PORT = process.env.PORT || 3000

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.static('uploads/'))

app.use('/api/v1', router)

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})
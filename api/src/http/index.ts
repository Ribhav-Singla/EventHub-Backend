import express from 'express'
import { router } from './routes/v1'
import cors from 'cors'
import { createServer } from 'http'
import intializeSocket from './socket'

const app = express()
const corsOptions = {
    origin: '*',
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
const PORT = process.env.PORT || 3000

app.use(cors(corsOptions))

const server = createServer(app)
intializeSocket(server)

app.use(express.json())
app.use(express.static('uploads/'))

app.get('/', async (req, res) => {
    res.send('Server is running')
})

app.use('/api/v1', router)

server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})
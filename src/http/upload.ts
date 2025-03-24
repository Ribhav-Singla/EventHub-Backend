import express from 'express'
import multer from 'multer'
import { userMiddleware } from './middleware/user'

export const imageRouter = express.Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

imageRouter.post('/', userMiddleware,upload.array('files', 10), async (req, res) => {
    console.log('inside image upload');
    
    const files = req.files as Express.Multer.File[] | undefined;
    if (files) {
        const fileUrls = files.map((file) => file.filename);
        console.log(fileUrls);
        res.json({ urls: fileUrls });
    } else {
        res.json({ error: 'Internal server error' });
    }
});

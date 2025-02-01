"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const index_1 = __importDefault(require("../../../db/index"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const user_1 = require("../../middleware/user");
const upload_1 = require("../../upload");
const event_1 = require("./event");
const user_2 = require("./user");
exports.router = express_1.default.Router();
exports.router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send('Healthy Server');
}));
exports.router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside signup');
    const saltRounds = 10;
    const salt = bcrypt_1.default.genSaltSync(saltRounds);
    const hashedPassword = bcrypt_1.default.hashSync(req.body.password, salt);
    try {
        const user = yield index_1.default.user.create({
            data: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                password: hashedPassword,
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.JWT_PASSWORD);
        res.json({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: '',
            token: token
        });
    }
    catch (error) {
        console.log('error thrown in signup');
        console.log(error);
        res.status(400).json({
            message: "Email already exists"
        });
    }
}));
exports.router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside login');
    try {
        const user = yield index_1.default.user.findUnique({
            where: {
                email: req.body.email
            }
        });
        if (!user) {
            res.status(401).json({
                message: "Invalid email"
            });
            return;
        }
        const isValid = bcrypt_1.default.compareSync(req.body.password, user.password);
        if (!isValid) {
            res.status(401).json({
                message: "Invalid password"
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.JWT_PASSWORD);
        res.json({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: '',
            token: token
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.router.post('/me', user_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside me');
    const userId = req.userId;
    try {
        const user = yield index_1.default.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        res.json({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            avatar: ''
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.router.use('/upload_images', upload_1.imageRouter);
exports.router.use('/event', event_1.eventRouter);
exports.router.use('/user', user_2.userRouter);

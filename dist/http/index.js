"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const v1_1 = require("./routes/v1");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const corsOptions = {
    origin: '*',
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.static('uploads/'));
app.use('/api/v1', v1_1.router);
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

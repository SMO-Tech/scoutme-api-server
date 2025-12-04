"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = __importDefault(require("./routes/user"));
const match_1 = __importDefault(require("./routes/match"));
const club_routes_1 = __importDefault(require("./routes/club_routes"));
const player_routes_1 = __importDefault(require("./routes/player_routes"));
const cors_1 = __importDefault(require("cors"));
const swagger_1 = __importDefault(require("./swagger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json("Hello World");
});
app.use("/user", user_1.default);
app.use("/match", match_1.default);
app.use("/club", club_routes_1.default);
app.use("/player", player_routes_1.default);
//swagger route 
app.use("/api-docs", swagger_1.default.swaggerUi.serve, swagger_1.default.swaggerUi.setup(swagger_1.default.specs));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port, http://localhost:${PORT}`));

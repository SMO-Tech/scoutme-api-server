"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const firebaseAdmin_1 = __importDefault(require("../utils/firebaseAdmin"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const idToken = authHeader.split("Bearer ")[1];
        //  Verify token with Firebase Admin
        const decodedToken = await firebaseAdmin_1.default.auth().verifyIdToken(idToken);
        // Attach the decoded user info to the request object
        req.user = decodedToken;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;

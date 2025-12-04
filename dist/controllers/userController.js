"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testToken = exports.registerUser = void 0;
const firebaseAdmin_1 = __importDefault(require("../utils/firebaseAdmin"));
const db_1 = require("../utils/db");
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, photoUrl, UID } = req.body;
        //see if user exist
        const user = await db_1.prisma.user.findUnique(email);
        if (user)
            return res.json({ message: "User already registered" });
        const newUser = await db_1.prisma.user.create({
            data: {
                name,
                email,
                phone,
                photoUrl,
                id: UID
            },
        });
        res
            .status(200)
            .json({ message: "User registered successfully!", data: { newUser } });
    }
    catch (e) {
        res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.registerUser = registerUser;
const testToken = async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: "UID is required in request body" });
        }
        // 1️⃣ Create a custom token for your test UID
        const customToken = await firebaseAdmin_1.default.auth().createCustomToken(uid);
        // 2️⃣ Exchange it for an ID token using Firebase REST API
        const apiKey = process.env.FIREBASE_API_KEY; // Store your Firebase Web API Key in .env
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: customToken,
                returnSecureToken: true,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(500).json({
                error: "Failed to exchange custom token for ID token",
                details: data,
            });
        }
        // 3️⃣ Send the ID token back
        return res.status(200).json({
            message: "Firebase test ID token generated successfully",
            uid,
            idToken: data.idToken,
            expiresIn: data.expiresIn,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.testToken = testToken;

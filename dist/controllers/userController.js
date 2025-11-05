"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const registerUser = async (req, res) => {
    try {
        console.log('saving user Data', req.body);
        const { name, email, phone, photoUrl, firebaseUID } = req.body;
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                photoUrl,
                firebaseUID
            },
        });
        res
            .status(200)
            .json({ message: "User registered successfully!", data: { newUser } });
    }
    catch (e) {
        console.error("Error saving user:", e); // <-- log the actual error
        res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.registerUser = registerUser;

import { RequestHandler } from "express";
import { PrismaClient } from "../generated/prisma/client";
const prisma = new PrismaClient();

export const registerUser: RequestHandler = async (req, res) => {
  try {
    console.log("saving user Data", req.body);
    const { name, email, phone, photoUrl, UID } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        photoUrl,
        UID,
      },
    });

    res
      .status(200)
      .json({ message: "User registered successfully!", data: { newUser } });
  } catch (e: any) {
    console.error("Error saving user:", e); // <-- log the actual error
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

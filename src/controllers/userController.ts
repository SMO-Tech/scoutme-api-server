import { RequestHandler } from "express";
import admin from "../utils/firebaseAdmin";
import { prisma } from "../utils/db";


export const registerUser: RequestHandler = async (req, res) => {
  try {
   
    const { name, email, phone, photoUrl, UID } = req.body;
    
    //see if user exist
    const user = await prisma.user.findUnique({
      where: email
    });

    if(user) return res.json({message: "User already registered"})

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        photoUrl,
        id:UID
      },
    });

    res
      .status(200)
      .json({ message: "User registered successfully!", data: { newUser } });
  } catch (e: any) {
  
    res.status(500).json({ error: e.message || "Something went wrong" });
 
  }
};

export const testToken: RequestHandler = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required in request body" });
    }

    // 1️⃣ Create a custom token for your test UID
    const customToken = await admin.auth().createCustomToken(uid);

    // 2️⃣ Exchange it for an ID token using Firebase REST API
    const apiKey = process.env.FIREBASE_API_KEY; // Store your Firebase Web API Key in .env
  
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

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
  } catch (e: any) {
 
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

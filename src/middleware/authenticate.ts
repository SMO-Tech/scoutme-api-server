import { Request, Response, NextFunction } from "express";
import firebaseAdmin from "../utils/firebaseAdmin";


export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    //  Verify token with Firebase Admin
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

    // Attach the decoded user info to the request object
    req.user = decodedToken;


    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

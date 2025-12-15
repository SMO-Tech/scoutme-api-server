import { Request, Response, NextFunction } from "express";

export const validateAPIKey =
  () => (req: Request, res: Response, next: NextFunction) => {
    try {
      const internalToken = process.env.INTERNAL_API_KEY;

      const apiKey = req.headers["x-api-key"];

      if (!apiKey) {
        return res.status(401).json({ error: "API key is missing" });
      }

      if (apiKey !== internalToken) {
        return res.status(403).json({ error: "Invalid API key" });
      }

      next();
    } catch (err) {
      console.error("API key validation failed:", err);
      return res.status(500).json({ error: "API key validation failed" });
    }
  };

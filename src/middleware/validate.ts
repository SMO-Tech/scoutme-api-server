import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateSchema =
  (schema: ZodSchema<any>, source: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[source]); // throws if invalid
      req[source] = result; // parsed + trimmed + typed
      next();
    } catch (err: any) {
      return res.status(400).json({
        error: true,
        message: "Validation failed",
        details: err.errors || err.issues || err.message,
      });
    }
  };

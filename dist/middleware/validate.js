"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = void 0;
const validateSchema = (schema, source = "body") => (req, res, next) => {
    try {
        const result = schema.parse(req[source]); // throws if invalid
        req[source] = result; // parsed + trimmed + typed
        next();
    }
    catch (err) {
        return res.status(400).json({
            error: true,
            message: "Validation failed",
            details: err.errors || err.issues || err.message,
        });
    }
};
exports.validateSchema = validateSchema;

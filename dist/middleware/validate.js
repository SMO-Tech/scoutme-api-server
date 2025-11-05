"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = void 0;
const validateSchema = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.validate(req.body, { abortEarly: false }); // validate all fields
            next();
        }
        catch (e) {
            const errors = e.inner?.map((err) => ({
                path: err.path,
                message: err.message,
            }));
            return res.status(400).json({ errors });
        }
    };
};
exports.validateSchema = validateSchema;

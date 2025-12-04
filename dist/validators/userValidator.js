"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserSchema = void 0;
const zod_1 = require("zod");
exports.registerUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email"),
    phone: zod_1.z.string().optional().nullable(),
    photoUrl: zod_1.z.string().optional().nullable(),
    UID: zod_1.z.string().min(1, "FirebaseUID is required!"),
});

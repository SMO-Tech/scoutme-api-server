"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchSchema = void 0;
const zod_1 = require("zod");
const constant_1 = require("../utils/constant");
exports.createMatchSchema = zod_1.z.object({
    videoUrl: zod_1.z.string().url(),
    lineUpImage: zod_1.z.string().url().optional(),
    matchLevel: zod_1.z.enum([
        "PROFESSIONAL",
        "SEMI_PROFESSIONAL",
        "ACADEMIC_TOP_TIER",
        "ACADEMIC_AMATEUR",
        "SUNDAY_LEAGUE",
    ]),
    clubs: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        country: zod_1.z.string(),
        jerseyColor: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        teamType: zod_1.z.enum(["yourTeam", "opponentTeam"]),
    })),
    players: zod_1.z.array(zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        jerseyNumber: zod_1.z.number().int().min(1),
        dateOfBirth: zod_1.z.string().nullable().optional(),
        position: zod_1.z.enum(constant_1.playerPostition),
        country: zod_1.z.string(),
        teamType: zod_1.z.enum(["yourTeam", "opponentTeam"]),
    })),
});

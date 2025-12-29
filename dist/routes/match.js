"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const validate_1 = require("../middleware/validate");
const matchValidators_1 = require("../validators/matchValidators");
const matchController_1 = require("../controllers/matchController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /match:
 *   post:
 *     summary: Create a new match request
 *     tags:
 *       - Match
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *               lineUpImage:
 *                 type: string
 *                 format: uri
 *               matchLevel:
 *                 type: string
 *                 enum: [PROFESSIONAL, SEMI_PROFESSIONAL, ACADEMIC_TOP_TIER, ACADEMIC_AMATEUR, SUNDAY_LEAGUE]
 *               clubs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     country:
 *                       type: string
 *                     jerseyColor:
 *                       type: string
 *                     teamType:
 *                       type: string
 *                       enum: [yourTeam, opponentTeam]
 *               players:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     jerseyNumber:
 *                       type: integer
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     position:
 *                       type: string
 *                     country:
 *                       type: string
 *                     teamType:
 *                       type: string
 *                       enum: [yourTeam, opponentTeam]
 *     responses:
 *       201:
 *         description: Match created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 matchId:
 *                   type: string
 *       400:
 *         description: User not found or validation error
 *       500:
 *         description: Server error
 */
router.post("/", authenticate_1.authenticate, (0, validate_1.validateSchema)(matchValidators_1.createMatchSchema), matchController_1.createMatchRequest);
// router.get("/", authenticate, allmatchRequestsOfUser);
// router.get("/:matchId", authenticate, getSpecificMatchAnalysis);
// router.post("/:matchId", authenticate, updateMatchStatus);
exports.default = router;

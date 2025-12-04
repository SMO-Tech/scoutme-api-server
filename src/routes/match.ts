import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { createMatchSchema } from "../validators/matchValidators";
import { allMatch, allmatchOfUser, createMatchRequest, getMatchAnalysis, updateMatchStatus } from "../controllers/matchController";


const router = Router();

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
router.post(
  "/",
  authenticate,
  validateSchema(createMatchSchema),
  createMatchRequest
);

router.get("/", authenticate, allmatchOfUser); //get all match of user
router.get("/all-match", authenticate, allMatch); //get all match 
router.get("/:matchId", authenticate, getMatchAnalysis); // get match analysis by id
router.post("/:matchId", authenticate, updateMatchStatus);

export default router;

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

/**
 * @swagger
 * /match/request:
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
  "/request",
  authenticate,
  validateSchema(createMatchSchema),
  createMatchRequest
);

/**
 * @swagger
 * /match/:
 *   get:
 *     tags: [Match]
 *     summary: Get all matches of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of matches for the user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, allmatchOfUser); //get all match of user
/**
 * @swagger
 * /match/all-match:
 *   get:
 *     tags: [Match]
 *     summary: Get all matches in the system (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 20
 *     responses:
 *       200:
 *         description: Paginated list of matches
 *       500:
 *         description: Server error
 */
router.get("/all-match", authenticate, allMatch); //get all match 
/**
 * @swagger
 * /match/{matchId}:
 *   get:
 *     tags: [Match]
 *     summary: Get match analysis by matchId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the match
 *     responses:
 *       200:
 *         description: Match analysis fetched
 *       400:
 *         description: matchId missing or invalid
 *       404:
 *         description: Match not found
 *       500:
 *         description: Server error
 */
router.get("/:matchId", authenticate, getMatchAnalysis); // get match analysis by id
/**
 * @swagger
 * /match/{matchId}:
 *   post:
 *     tags: [Match]
 *     summary: Update match status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *                 example: PROCESSING
 *     responses:
 *       200:
 *         description: Match status updated
 *       400:
 *         description: Invalid or missing status
 *       404:
 *         description: Match not found
 *       500:
 *         description: Server error
 */
router.post("/:matchId", authenticate, updateMatchStatus);

export default router;

import { Router } from "express";
import {
  listPlayerProfiles,
  getPlayerProfileById,
  searchPlayerProfiles,
  updatePlayerProfile,
  getProfileVisitAnalytics,
  getMyProfile,
} from "../controllers/player_profile_controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 * @swagger
 * /player/:
 *   get:
 *     summary: List all player profiles
 *     tags: [Player Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Player profiles listed successfully
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, listPlayerProfiles); // list all player profiles

/**
 * @swagger
 * /player/search:
 *   get:
 *     summary: Search player profiles
 *     tags: [Player Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateOfBirth
 *         schema:
 *           type: string
 *           example: "2000-05-12"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player profiles searched successfully
 *       500:
 *         description: Server error
 */
router.get("/search", authenticate, searchPlayerProfiles); // search player profiles by parameters

router.get("/me", authenticate, getMyProfile);
/**
 * @swagger
 * /player/{id}:
 *   get:
 *     summary: Get player profile by ID
 *     tags: [Player Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player profile fetched successfully
 *       404:
 *         description: Player profile not found
 *       500:
 *         description: Server error
 */
router.get("/:id", authenticate, getPlayerProfileById); // get a player profile by id

/**
 * @swagger
 * /player/{id}:
 *   put:
 *     summary: Update a player profile
 *     tags: [Player Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               dateOfBirth: { type: string, example: "12-05-2001" }
 *               country: { type: string }
 *               avatar: { type: string }
 *               primaryPosition: { type: string }
 *     responses:
 *       200:
 *         description: Player profile updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Player profile not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticate, updatePlayerProfile); // update a player profile

/**
 * @swagger
 * /player/analytics/visits:
 *   get:
 *     summary: Get profile visit analytics - who visited my profile
 *     tags: [Player Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile visit analytics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Profile visit analytics fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     todayStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           profileType:
 *                             type: string
 *                             example: Football Player
 *                           count:
 *                             type: integer
 *                             example: 5
 *                           uniqueVisitors:
 *                             type: integer
 *                             example: 5
 *                           visitors:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 userId:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                                 phone:
 *                                   type: string
 *                                 profileType:
 *                                   type: string
 *                                 visitedAt:
 *                                   type: string
 *                     recentVisits:
 *                       type: array
 *                     totalVisits:
 *                       type: integer
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get("/analytics/visits", authenticate, getProfileVisitAnalytics); // get profile visit analytics

export default router;

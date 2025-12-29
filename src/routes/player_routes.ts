import { Router } from "express";
import {
  listPlayerProfiles,
  getPlayerProfileById,
  searchPlayerProfiles,
  updatePlayerProfile,
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

export default router;

import { Router } from "express";
import { getPlayerStatistics, getClubStatistics } from "../controllers/statics_controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 * @swagger
 * /statics/player:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get player statistics from SMO_V1 database
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: player_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The player ID to fetch statistics for
 *         example: 106461
 *     responses:
 *       200:
 *         description: Player statistics fetched successfully
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
 *                   example: Player statistics fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cache_type:
 *                         type: string
 *                       player_id:
 *                         type: integer
 *                       action_type:
 *                         type: string
 *                       attacking_spider:
 *                         type: object
 *                       defensive_spider:
 *                         type: object
 *                       attacking_donut:
 *                         type: object
 *                       defensive_donut:
 *                         type: object
 *                       attacking_heatmap:
 *                         type: object
 *                       defensive_heatmap:
 *                         type: object
 *                       goalpost_statistics_data:
 *                         type: object
 *                       summary_table:
 *                         type: object
 *       400:
 *         description: Bad request - player_id is required or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: player_id is required
 *       404:
 *         description: No statistics found for the given player_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No statistics found for the given player_id
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/player", authenticate, getPlayerStatistics);

// get club statistics
router.get("/club/:club_id", authenticate, getClubStatistics);
export default router;


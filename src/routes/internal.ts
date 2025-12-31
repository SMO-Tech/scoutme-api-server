import { Router } from "express";

import { validateAPIKey } from "../middleware/validateApiKey";
import { nextMatch, updateMatchStatusInternal, submitMatchAnalysis } from "../controllers/internalController";

const router = Router();


/**
 * @swagger
 * /internal/next-match:
 *   get:
 *     summary: Get the next pending match
 *     description: >
 *       Returns the oldest match with status PENDING.
 *       Requires a valid internal API key via x-api-key header.
 *     tags:
 *       - internal
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Match found or no pending matches
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Next match is available to analyse
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "match_123"
 *                         videoUrl:
 *                           type: string
 *                           example: "https://example.com/video.mp4"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: No pending matches available.
 *       401:
 *         description: API key missing
 *       403:
 *         description: Invalid API key
 *       500:
 *         description: Server error
 */
router.get('/next-match', validateAPIKey(), nextMatch);

/**
 * @swagger
 * /internal/{matchId}:
 *   post:
 *     summary: Update match status
 *     description: Updates the status of a match by ID.
 *     tags:
 *       - internal
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, COMPLETED]
 *                 example: PROCESSING
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Match status updated to COMPLETED
 *       400:
 *         description: Invalid input
 *       401:
 *         description: API key missing
 *       403:
 *         description: Invalid API key
 *       404:
 *         description: Match not found
 *       500:
 *         description: Server error
 */
router.put('/:matchId', validateAPIKey(), updateMatchStatusInternal);

// save match analysis data
router.post('/result/:matchId/', validateAPIKey(), submitMatchAnalysis);

// utsav - ignore the line for main testing
export default router
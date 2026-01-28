import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { createMatchSchema } from "../validators/matchValidators";
import { allmatchOfUser, createMatchRequest,  } from "../controllers/matchController";


const router = Router();


router.post(
  "/",
  authenticate,
  validateSchema(createMatchSchema),
  createMatchRequest
);


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
// router.get("/all-match", authenticate, allMatch); //get all match 
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
// router.get("/:matchId", authenticate, getMatchAnalysis); // get match analysis by id


export default router;

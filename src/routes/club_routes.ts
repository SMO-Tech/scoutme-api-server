import { Router } from "express";

import { listClubs, getClubById, createClub, updateClub, deleteClub } from "../controllers/club_controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 * @swagger
 * /clubs:
 *   get:
 *     tags:
 *       - Clubs
 *     summary: List all clubs
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: Clubs listed successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       country:
 *                         type: string
 *                       logoUrl:
 *                         type: string
 *                         nullable: true
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
 *                   example: Something went wrong
 */
router.get("/", authenticate ,listClubs); // list all clubs

/**
 * @swagger
 * /clubs/{id}:
 *   get:
 *     tags:
 *       - Clubs
 *     summary: Get a club by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     responses:
 *       200:
 *         description: Club fetched successfully
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
 *                   example: Club fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     country:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                       nullable: true
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
 *                   example: Something went wrong
 */
router.get("/:id",authenticate, getClubById); // get a club by id

/**
 * @swagger
 * /clubs:
 *   post:
 *     tags:
 *       - Clubs
 *     summary: Create a new club
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Manchester United"
 *               country:
 *                 type: string
 *                 example: "England"
 *               logoUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://example.com/logo.png"
 *     responses:
 *       200:
 *         description: Club created successfully
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
 *                   example: Club created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     country:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                       nullable: true
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
 *                   example: Something went wrong
 */
router.post("/", authenticate ,createClub); // create a new club

/**
 * @swagger
 * /clubs/{id}:
 *   put:
 *     tags:
 *       - Clubs
 *     summary: Update a club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Manchester United"
 *               country:
 *                 type: string
 *                 example: "England"
 *               logoUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://example.com/logo.png"
 *     responses:
 *       200:
 *         description: Club updated successfully
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
 *                   example: Club updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     country:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                       nullable: true
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
 *                   example: Something went wrong
 */
router.put("/:id", authenticate,updateClub); // update a club

/**
 * @swagger
 * /clubs/{id}:
 *   delete:
 *     tags:
 *       - Clubs
 *     summary: Delete a club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     responses:
 *       200:
 *         description: Club deleted successfully
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
 *                   example: Club deleted successfully
 *       404:
 *         description: Club not found
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
 *                   example: Club not found
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
 *                   example: Something went wrong
 */
router.delete("/:id", authenticate ,deleteClub); // delete a club

export default router;

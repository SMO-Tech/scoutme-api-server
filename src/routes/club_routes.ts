import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { createMatchSchema } from "../validators/matchValidators";
import { createMatchRequest } from "../controllers/matchController";
import { listClubs, getClubById, createClub, updateClub, deleteClub } from "../controllers/club_controller";

const router = Router();

router.get("/", listClubs); // list all clubs
router.get("/:id", getClubById); // get a club by id
router.post("/", createClub); // create a new club
router.put("/:id", updateClub); // update a club
router.delete("/:id", deleteClub); // delete a club

export default router;

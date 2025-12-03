import { Router } from "express";
import { listPlayerProfiles ,getPlayerProfileById, searchPlayerProfiles } from "../controllers/player_profile_controller";

const router = Router();

router.get("/", listPlayerProfiles); // list all player profiles
router.get("/search", searchPlayerProfiles); // search player profiles by parameters
router.get("/:id", getPlayerProfileById); // get a player profile by id

export default router;


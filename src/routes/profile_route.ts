import { Router } from "express";
import {
    listFootballPlayerProfiles,
    listScoutProfiles,
} from "../controllers/profile_controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.get("/players", listFootballPlayerProfiles);
router.get("/scouts", listScoutProfiles);
export default router;
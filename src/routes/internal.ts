import { Router } from "express";

import { validateAPIKey } from "../middleware/validateApiKey";
import { nextMatch, updateMatchStatus } from "../controllers/internalController";

const router = Router();


router.get('/next-match', validateAPIKey() ,nextMatch)
router.post('/:matchId', validateAPIKey() , updateMatchStatus)

export default router
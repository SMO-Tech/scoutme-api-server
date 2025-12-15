import { Router } from "express";

import { validateAPIKey } from "../middleware/validateApiKey";
import { nextMatch } from "../controllers/internalController";

const router = Router();


router.get('/next-match', validateAPIKey() ,nextMatch)

export default router
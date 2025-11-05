import { Router } from "express";
import { requestMatchAnalysis } from "../controllers/matchController";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { matchRequestSchema } from "../validators/matchValidators";

const router = Router()

router.post('/request', authenticate, validateSchema(matchRequestSchema) ,requestMatchAnalysis)

export default router
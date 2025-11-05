import { Router } from "express";
import { requestMatchAnalysis } from "../controllers/matchController";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { mathcRequestSchema } from "../validators/matchValidators";

const router = Router()

router.post('/request', authenticate, validateSchema(mathcRequestSchema) ,requestMatchAnalysis)

export default router
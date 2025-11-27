import { Router } from "express";
import { requestMatchAnalysis } from "../controllers/matchController";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { matchRequestSchema } from "../validators/matchValidators";

const router = Router();

router.post(
  "/",
  authenticate,
  validateSchema(matchRequestSchema),
  requestMatchAnalysis
);

// router.get("/", authenticate, allmatchRequestsOfUser);
// router.get("/:matchId", authenticate, getSpecificMatchAnalysis);
// router.post("/:matchId", authenticate, updateMatchStatus);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { createMatchSchema } from "../validators/matchValidators";
import {
  allmatchOfUser,
  createMatchRequest,
  getMatchAnalysis,
} from "../controllers/matchController";

const router = Router();

router.post(
  "/",
  authenticate,
  validateSchema(createMatchSchema),
  createMatchRequest,
);

router.get("/", authenticate, allmatchOfUser); //get all match of user

router.get("/:matchId", authenticate, getMatchAnalysis); // get match analysis by id

export default router;

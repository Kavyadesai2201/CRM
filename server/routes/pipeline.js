// /server/routes/pipeline.js
import { Router } from "express";
import { getPipelineStages, moveLeadToStage, getPipelineStats } from "../controllers/pipelineController.js";
import authenticate from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/stages", getPipelineStages);
router.get("/stats", getPipelineStats);
router.patch("/:leadId/stage", moveLeadToStage);
export default router;

// /server/routes/analytics.js
import { Router } from "express";
import { getDashboardStats, getLeadsBySource, getConversionReport, getRevenueTimeline } from "../controllers/analyticsController.js";
import authenticate from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/dashboard", getDashboardStats);
router.get("/leads-by-source", getLeadsBySource);
router.get("/conversion", getConversionReport);
router.get("/revenue", getRevenueTimeline);
export default router;

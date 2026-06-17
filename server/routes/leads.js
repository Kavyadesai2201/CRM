// /server/routes/leads.js
import { Router } from "express";
import { getAllLeads, getLeadById, createLead, updateLead, deleteLead } from "../controllers/leadsController.js";
import { getLeadMessages } from "../controllers/messagesController.js";
import { leadAI } from "../controllers/aiController.js";
import authenticate from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/", getAllLeads);
router.get("/:id/messages", getLeadMessages);
router.get("/:id", getLeadById);
router.post("/", createLead);
router.post("/:id/ai", leadAI);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);
export default router;

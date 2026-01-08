import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
import {
  studentDashboard,
  markAttendance,
  studentActivity,
} from "../controllers/studentController.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.get("/dashboard", studentDashboard);
router.post("/attendance/mark", markAttendance);
router.get("/activity", studentActivity);

export default router;

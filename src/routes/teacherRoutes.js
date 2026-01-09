import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
import {
  teacherDashboard,
  mappedStudents,
  startAttendance,
  endAttendance,
  manualAttendance,
  teacherActivityLog,
  saveAttendanceBackup,
  getAttendanceHistory,
  downloadAttendanceBackup,
  exportAttendanceExcel,
  teacherGetDefaulterList,
  teacherDownloadDefaulterList,
} from "../controllers/teacherController.js";

const router = Router();

router.use(requireAuth, requireRole("teacher"));

router.get("/dashboard", teacherDashboard);
router.get("/students", mappedStudents);
router.post("/attendance/start", startAttendance);
router.post("/attendance/end", endAttendance);
router.post("/attendance/manual", manualAttendance);
router.get("/activity", teacherActivityLog);
router.post("/attendance/backup", saveAttendanceBackup);
router.get("/attendance/history", getAttendanceHistory);
router.get("/attendance/backup/:id", downloadAttendanceBackup);
router.post("/attendance/export-excel", exportAttendanceExcel);

// Defaulter management routes
router.get("/defaulters", teacherGetDefaulterList);
router.get("/defaulters/download", teacherDownloadDefaulterList);

export default router;

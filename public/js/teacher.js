import {
  showToast,
  apiFetch,
  formatDateTime,
  asPercentage,
  toggleLoading,
} from "./main.js";

const summarySessionsEl = document.querySelector("[data-summary-sessions]");
const summaryAverageEl = document.querySelector("[data-summary-average]");
const summaryPresentEl = document.querySelector("[data-summary-present]");
const recentBody = document.querySelector("[data-recent-body]");
const activityBody = document.querySelector("[data-activity-body]");
const refreshButton = document.querySelector("[data-refresh]");
const refreshActivityButton = document.querySelector("[data-refresh-activity]");
const clearRecentButton = document.querySelector("[data-clear-recent]");
const clearActivityButton = document.querySelector("[data-clear-activity]");
const signoutButton = document.querySelector("[data-signout]");
const startSessionButton = document.querySelector("[data-start-session]");
const endSessionButton = document.querySelector("[data-end-session]");
const manualButton = document.querySelector("[data-open-manual]");
const manualModal = document.querySelector("[data-manual-modal]");
const manualForm = manualModal?.querySelector("form");
const sessionModal = document.querySelector("[data-session-modal]");
const sessionForm = sessionModal?.querySelector("form");
const activeSection = document.querySelector("[data-active-session]");
const attendanceBody = document.querySelector("[data-attendance-body]");
const viewHistoryButton = document.querySelector("[data-view-history]");
const historyModal = document.querySelector("[data-history-modal]");
const historyBody = document.querySelector("[data-history-body]");
const closeHistoryButton = document.querySelector("[data-close-history]");

const snapshotSubject = document.querySelector("[data-session-subject]");
const snapshotYear = document.querySelector("[data-session-year]");
const snapshotDivision = document.querySelector("[data-session-division]");
const snapshotStream = document.querySelector("[data-session-stream]");
const snapshotStart = document.querySelector("[data-session-start]");
const badgeSize = document.querySelector("[data-session-size]");
const badgePresent = document.querySelector("[data-session-present]");
const badgeAbsent = document.querySelector("[data-session-absent]");

let currentSession = null;
let lastSessionDetails = null;
let teacherData = null;
let availableStreams = [];
let availableDivisions = [];

function handleError(error, fallback = "Something went wrong") {
  console.error(error);
  showToast({
    title: "Heads up",
    message: error.message || fallback,
    type: "danger",
  });
}

async function loadDashboard() {
  try {
    const data = await apiFetch("/api/teacher/dashboard");
    teacherData = data.teacherInfo || {};
    availableStreams = data.streams || [];
    availableDivisions = data.divisions || [];

    const summary = data?.summary || {};
    summarySessionsEl.textContent = summary.sessions ?? 0;
    summaryAverageEl.textContent = `${summary.averagePercentage ?? 0}%`;
    summaryPresentEl.textContent = summary.totalPresent ?? 0;
    renderRecentSessions(data?.recentSessions || []);

    // Populate dropdowns
    populateSubjectDropdown();
    populateStreamDropdown();
    populateDivisionDropdown();
  } catch (error) {
    handleError(error, "Unable to load dashboard");
  }
}

function populateSubjectDropdown() {
  const subjectDropdown = document.querySelector("#sessionSubject");
  if (!subjectDropdown || !teacherData?.subject) return;

  // Clear existing options except the first one
  while (subjectDropdown.options.length > 1) {
    subjectDropdown.remove(1);
  }

  // Add teacher's subject(s) - split by comma if multiple subjects
  const subjects = teacherData.subject.split(",").map((s) => s.trim());
  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectDropdown.appendChild(option);
  });

  // Pre-select first subject if available
  if (subjects.length > 0) {
    subjectDropdown.value = subjects[0];
  }
}

function populateStreamDropdown() {
  const streamDropdown = document.querySelector("#sessionStream");
  if (!streamDropdown) return;

  // Clear existing options except the first one
  while (streamDropdown.options.length > 1) {
    streamDropdown.remove(1);
  }

  // Add all available streams
  availableStreams.forEach((stream) => {
    const option = document.createElement("option");
    option.value = stream;
    option.textContent = stream;
    streamDropdown.appendChild(option);
  });

  // Pre-select teacher's stream if available
  if (teacherData?.stream && availableStreams.includes(teacherData.stream)) {
    streamDropdown.value = teacherData.stream;
  }
}

function populateDivisionDropdown() {
  const divisionDropdown = document.querySelector("#sessionDivision");
  if (!divisionDropdown) return;

  // Clear existing options except the first one
  while (divisionDropdown.options.length > 1) {
    divisionDropdown.remove(1);
  }

  // Add all available divisions
  availableDivisions.forEach((division) => {
    const option = document.createElement("option");
    option.value = division;
    option.textContent = division;
    divisionDropdown.appendChild(option);
  });
}

function renderRecentSessions(sessions) {
  if (!recentBody) return;

  if (!sessions.length) {
    recentBody.innerHTML = `<tr><td colspan="6">No sessions recorded yet.</td></tr>`;
    return;
  }

  const rows = sessions
    .map((session) => {
      const present = session.present_count ?? 0;
      const absent = session.absent_count ?? 0;
      const total = present + absent;
      const percentage = total ? asPercentage(present, total) : "—";

      return `
        <tr>
          <td>${formatDateTime(session.started_at)}</td>
          <td>${session.subject || "—"}</td>
          <td>${session.division || "—"}</td>
          <td>${present}</td>
          <td>${absent}</td>
          <td>${percentage}</td>
        </tr>
      `;
    })
    .join("");

  recentBody.innerHTML = rows;
}

async function loadActivity() {
  try {
    const { activity } = await apiFetch("/api/teacher/activity");
    renderActivity(activity || []);
  } catch (error) {
    handleError(error, "Unable to load activity log");
  }
}

function formatActivityAction(action) {
  switch (action) {
    case "START_ATTENDANCE":
      return "Session started";
    case "END_ATTENDANCE":
      return "Session ended";
    case "MANUAL_OVERRIDE":
      return "Manual override";
    default:
      return action;
  }
}

function renderActivity(activity) {
  if (!activityBody) return;

  if (!activity.length) {
    activityBody.innerHTML = `<tr><td colspan="3">No activity yet.</td></tr>`;
    return;
  }

  const rows = activity
    .map((item) => {
      let meta = {};
      if (item.details) {
        try {
          meta = JSON.parse(item.details);
        } catch (error) {
          console.warn("Unable to parse activity details", error);
        }
      }

      const detailText = buildDetailText(item.action, meta);

      return `
        <tr>
          <td>${formatDateTime(item.created_at)}</td>
          <td>${formatActivityAction(item.action)}</td>
          <td>${detailText}</td>
        </tr>
      `;
    })
    .join("");

  activityBody.innerHTML = rows;
}

function handleClearRecent() {
  if (!confirm("Are you sure you want to clear the Recent Classes list? This will only clear the display, not delete records from the database.")) {
    return;
  }

  if (recentBody) {
    recentBody.innerHTML = '<tr><td colspan="6">Recent classes cleared.</td></tr>';
    showToast({
      title: "Cleared",
      message: "Recent classes list has been cleared.",
      type: "success",
    });
  }
}

function handleClearActivity() {
  if (!confirm("Are you sure you want to clear the Activity Log? This will only clear the display, not delete records from the database.")) {
    return;
  }

  if (activityBody) {
    activityBody.innerHTML = '<tr><td colspan="3">Activity log cleared.</td></tr>';
    showToast({
      title: "Cleared",
      message: "Activity log has been cleared.",
      type: "success",
    });
  }
}

function buildDetailText(action, meta) {
  if (!meta || typeof meta !== "object") return "—";

  if (action === "START_ATTENDANCE") {
    return (
      [meta.subject, meta.stream, meta.division].filter(Boolean).join(" · ") ||
      "—"
    );
  }

  if (action === "END_ATTENDANCE") {
    const present = meta.present ?? 0;
    const absent = meta.absent ?? 0;
    const total = present + absent;
    const percentage = total ? asPercentage(present, total) : "—";
    return `${meta.subject || "Class"
      } • ${percentage} (${present} present/${absent} absent)`;
  }

  if (action === "MANUAL_OVERRIDE") {
    const status = meta.status === "P" ? "present" : "absent";
    const reason = meta.reason ? ` – ${meta.reason}` : "";
    return `Student ${meta.studentId || "—"} marked ${status}${reason}`;
  }

  return (
    Object.entries(meta)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ") || "—"
  );
}

function updateSnapshot(details) {
  snapshotSubject.textContent = details?.subject || "–";
  snapshotYear.textContent = details?.year || "–";
  snapshotDivision.textContent = details?.division || "–";
  snapshotStream.textContent = details?.stream || "–";
  snapshotStart.textContent = details?.startedAt
    ? formatDateTime(details.startedAt)
    : "–";
}

function updateSessionBadges() {
  if (!currentSession) {
    badgeSize.textContent = "0 students";
    badgePresent.textContent = "0 present";
    badgeAbsent.textContent = "0 absent";
    return;
  }

  const total = currentSession.students.length;
  const present = currentSession.students.filter(
    (item) => item.status === "P"
  ).length;
  const absent = total - present;

  badgeSize.textContent = `${total} student${total === 1 ? "" : "s"}`;
  badgePresent.textContent = `${present} present`;
  badgeAbsent.textContent = `${absent} absent`;
}

function renderActiveSession() {
  if (!activeSection || !attendanceBody) return;

  if (!currentSession) {
    activeSection.style.display = "none";
    attendanceBody.innerHTML = `
      <tr>
        <td colspan="4">Tap "Start attendance" to begin.</td>
      </tr>
    `;
    updateSnapshot(null);
    updateSessionBadges();
    return;
  }

  activeSection.style.display = "block";
  updateSnapshot(currentSession);
  updateSessionBadges();

  const rows = currentSession.students
    .map(
      (student) => `
        <tr data-student="${student.id}">
          <td>${student.rollNo || "–"}</td>
          <td>${student.id}</td>
          <td>${student.name}</td>
          <td>
            <button type="button" class="status-pill" data-toggle-status data-status="${student.status
        }" data-student="${student.id}">
              ${student.status === "P" ? "Present" : "Absent"}
            </button>
          </td>
        </tr>
      `
    )
    .join("");

  attendanceBody.innerHTML = rows;
}

function toggleStudentStatus(studentId) {
  if (!currentSession) return;

  const target = currentSession.students.find(
    (student) => student.id === studentId
  );
  if (!target) return;

  target.status = target.status === "P" ? "A" : "P";
  renderActiveSession();
}

function attachAttendanceEvents() {
  if (!attendanceBody) return;

  attendanceBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle-status]");
    if (!button) return;

    const studentId = button.dataset.student;
    toggleStudentStatus(studentId);
  });
}

async function handleStartSession(event) {
  event.preventDefault();
  if (!sessionForm) return;

  if (currentSession) {
    showToast({
      title: "Session active",
      message: "End the current session before starting another.",
      type: "warning",
    });
    return;
  }

  const submitButton = sessionForm.querySelector('button[value="submit"]');
  const formData = new FormData(sessionForm);
  const payload = {
    subject: formData.get("subject")?.trim(),
    year: formData.get("year")?.trim(),
    stream: formData.get("stream")?.trim(),
    division: formData.get("division")?.trim(),
  };

  if (!payload.subject || !payload.year || !payload.stream || !payload.division) {
    showToast({
      title: "Missing info",
      message: "Please fill subject, year, stream, and division.",
      type: "warning",
    });
    return;
  }

  try {
    toggleLoading(submitButton, true);
    const response = await apiFetch("/api/teacher/attendance/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const students = Array.isArray(response.students)
      ? response.students.map((student) => ({
        id: student.student_id,
        name: student.student_name,
        rollNo: student.roll_no,
        stream: student.stream,
        division: student.division,
        status: "P",
      }))
      : [];

    currentSession = {
      id: response.sessionId,
      subject: payload.subject,
      year: payload.year,
      stream: payload.stream,
      division: payload.division,
      startedAt: new Date(),
      students,
    };

    lastSessionDetails = { ...payload };

    renderActiveSession();
    sessionForm.reset();
    sessionModal.close();

    showToast({
      title: "Session ready",
      message: "Attendance session started.",
      type: "success",
    });
  } catch (error) {
    handleError(error, "Unable to start attendance session");
  } finally {
    toggleLoading(submitButton, false);
  }
}

async function exportAttendanceCsv(summary) {
  if (!currentSession) return;

  // Request server to generate formatted Excel file
  try {
    const payload = {
      sessionId: currentSession.id,
      subject: currentSession.subject,
      year: currentSession.year,
      stream: currentSession.stream,
      division: currentSession.division,
      startedAt: currentSession.startedAt,
      teacherName: teacherData?.name || "Teacher",
      summary: summary,
      students: currentSession.students.map((s) => ({
        rollNo: s.rollNo ?? "",
        studentId: s.id,
        name: s.name,
        status: s.status,
      })),
    };

    const response = await fetch("/api/teacher/attendance/export-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to generate Excel file");
    }

    // Get the blob and download it
    const blob = await response.blob();

    // Build filename as requested: DD-MM-YYYY_HH-MM-SS_subjectname_attendance_record
    const pad = (n) => String(n).padStart(2, "0");
    const d = currentSession.startedAt
      ? new Date(currentSession.startedAt)
      : new Date();
    const datePart = `${pad(d.getDate())}-${pad(
      d.getMonth() + 1
    )}-${d.getFullYear()}`;
    const timePart = `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(
      d.getSeconds()
    )}`;
    const subjectPart = (currentSession.subject || "session")
      .replace(/[^a-z0-9-_ ]/gi, "")
      .replace(/\s+/g, "_");
    const filename = `${datePart}_${timePart}_${subjectPart}_attendance_record.xlsx`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    // Also send backup to server for history
    const backupPayload = {
      filename,
      fileContent: await blob.text(), // Note: this will be binary, we'll handle it on server
      sessionId: currentSession.id,
      subject: currentSession.subject,
      year: currentSession.year,
      stream: currentSession.stream,
      division: currentSession.division,
      startedAt: currentSession.startedAt,
      attendance: currentSession.students.map((s) => ({
        studentId: s.id,
        status: s.status,
      })),
    };

    apiFetch("/api/teacher/attendance/backup", {
      method: "POST",
      body: JSON.stringify(backupPayload),
    }).catch((err) => console.warn("Attendance backup failed:", err));
  } catch (err) {
    console.warn("Failed to export Excel:", err);
    showToast({
      title: "Export failed",
      message: "Unable to generate Excel file. Please try again.",
      type: "error",
    });
  }
}

async function handleEndSession() {
  if (!currentSession) {
    showToast({
      title: "No active session",
      message: "Start a session before ending attendance.",
      type: "warning",
    });
    return;
  }

  try {
    toggleLoading(endSessionButton, true);
    const payload = {
      sessionId: currentSession.id,
      subject: currentSession.subject,
      year: currentSession.year,
      stream: currentSession.stream,
      division: currentSession.division,
      attendance: currentSession.students.map((student) => ({
        studentId: student.id,
        status: student.status,
      })),
    };

    const response = await apiFetch("/api/teacher/attendance/end", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    showToast({
      title: "Attendance saved",
      message: "Session saved successfully. View it in the history tab.",
      type: "success",
    });

    currentSession = null;
    renderActiveSession();
    loadDashboard();
    loadActivity();
  } catch (error) {
    handleError(error, "Unable to end attendance session");
  } finally {
    toggleLoading(endSessionButton, false);
  }
}

async function handleManualOverride(event) {
  event.preventDefault();
  if (!manualForm) return;

  const submitButton = manualForm.querySelector('button[value="submit"]');
  const formData = new FormData(manualForm);
  const payload = {
    studentId: formData.get("studentId")?.trim(),
    status: formData.get("status"),
    reason: formData.get("reason")?.trim(),
  };

  if (!payload.studentId || !payload.status) {
    showToast({
      title: "Missing info",
      message: "Student ID and status are required.",
      type: "warning",
    });
    return;
  }

  try {
    toggleLoading(submitButton, true);
    await apiFetch("/api/teacher/attendance/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (currentSession) {
      const student = currentSession.students.find(
        (item) => item.id === payload.studentId
      );
      if (student) {
        student.status = payload.status === "P" ? "P" : "A";
        renderActiveSession();
      }
    }

    showToast({
      title: "Override saved",
      message: "Manual attendance override recorded.",
      type: "success",
    });

    manualForm.reset();
    manualModal.close();
    loadActivity();
  } catch (error) {
    handleError(error, "Unable to save manual override");
  } finally {
    toggleLoading(submitButton, false);
  }
}

function initDialogs() {
  if (startSessionButton && sessionModal && sessionForm) {
    startSessionButton.addEventListener("click", () => {
      if (currentSession) {
        showToast({
          title: "Session active",
          message: "End the current session before starting another.",
          type: "warning",
        });
        return;
      }

      sessionForm.reset();

      // Re-populate dropdowns after reset
      populateSubjectDropdown();
      populateStreamDropdown();
      populateDivisionDropdown();

      // Pre-fill with teacher's stream
      if (teacherData?.stream) {
        sessionForm.querySelector("#sessionStream").value = teacherData.stream;
      }

      // Restore last session details if available
      if (lastSessionDetails) {
        if (lastSessionDetails.subject) {
          sessionForm.querySelector("#sessionSubject").value =
            lastSessionDetails.subject;
        }
        if (lastSessionDetails.stream) {
          sessionForm.querySelector("#sessionStream").value =
            lastSessionDetails.stream;
        }
        if (lastSessionDetails.division) {
          sessionForm.querySelector("#sessionDivision").value =
            lastSessionDetails.division;
        }
      }

      sessionModal.showModal();
    });

    sessionForm.addEventListener("submit", handleStartSession);

    // Handle cancel button
    const cancelSessionButton = sessionModal.querySelector(
      "[data-cancel-session]"
    );
    if (cancelSessionButton) {
      cancelSessionButton.addEventListener("click", () => {
        sessionModal.close();
      });
    }
  }

  if (manualButton && manualModal && manualForm) {
    manualButton.addEventListener("click", () => {
      manualForm.reset();
      manualModal.showModal();
    });

    manualForm.addEventListener("submit", handleManualOverride);

    // Handle cancel button
    const cancelManualButton = manualModal.querySelector(
      "[data-cancel-manual]"
    );
    if (cancelManualButton) {
      cancelManualButton.addEventListener("click", () => {
        manualModal.close();
      });
    }
  }
}

function initControls() {
  refreshButton?.addEventListener("click", async () => {
    showToast({
      title: "Refreshing",
      message: "Reloading dashboard data...",
      type: "info",
    });
    await loadDashboard();
  });

  refreshActivityButton?.addEventListener("click", async () => {
    showToast({
      title: "Refreshing",
      message: "Reloading activity log...",
      type: "info",
    });
    await loadActivity();
  });

  clearRecentButton?.addEventListener("click", handleClearRecent);
  clearActivityButton?.addEventListener("click", handleClearActivity);
  endSessionButton?.addEventListener("click", handleEndSession);

  viewHistoryButton?.addEventListener("click", async () => {
    if (historyModal) {
      historyModal.showModal();
      await loadAttendanceHistory();
    }
  });

  closeHistoryButton?.addEventListener("click", () => {
    if (historyModal) {
      historyModal.close();
    }
  });

  signoutButton?.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      handleError(error, "Unable to sign out");
    }
  });
}

async function loadAttendanceHistory() {
  if (!historyBody) return;

  try {
    historyBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    const { history } = await apiFetch("/api/teacher/attendance/history");

    if (!history || !history.length) {
      historyBody.innerHTML =
        '<tr><td colspan="6">No attendance history found.</td></tr>';
      return;
    }

    const rows = history
      .map((item) => {
        const savedDate = formatDateTime(item.saved_at);
        return `
        <tr>
          <td>${item.filename || "—"}</td>
          <td>${item.subject || "—"}</td>
          <td>${item.stream || "—"}</td>
          <td>${item.division || "—"}</td>
          <td>${savedDate}</td>
          <td>
            <a href="/api/teacher/attendance/backup/${item.id
          }" class="btn ghost" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" download>
              Download
            </a>
          </td>
        </tr>
      `;
      })
      .join("");

    historyBody.innerHTML = rows;
  } catch (error) {
    historyBody.innerHTML =
      '<tr><td colspan="6">Failed to load history.</td></tr>';
    handleError(error, "Unable to load attendance history");
  }
}

function initDefaulterButton() {
  const defaulterButton = document.querySelector("[data-generate-defaulters]");
  if (!defaulterButton) return;

  defaulterButton.addEventListener("click", async () => {
    try {
      // Prompt for threshold
      const thresholdInput = prompt(
        "Enter the minimum attendance percentage threshold (0-100):",
        "75"
      );

      if (thresholdInput === null) {
        return; // User cancelled
      }

      const threshold = parseFloat(thresholdInput);

      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        showToast({
          title: "Invalid Input",
          message: "Please enter a valid percentage between 0 and 100.",
          type: "danger",
        });
        return;
      }

      // Optional filters
      const month = prompt(
        "Enter month (1-12) or leave blank for all months:",
        ""
      );
      const year = prompt(
        "Enter year (e.g., 2024) or leave blank for current year:",
        ""
      );

      // Build query parameters
      const params = new URLSearchParams();
      params.append("threshold", threshold.toString());

      if (month && month.trim() !== "") {
        const monthNum = parseInt(month);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
          params.append("month", monthNum.toString());
        }
      }

      if (year && year.trim() !== "") {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
          params.append("year", yearNum.toString());
        }
      }

      // Show loading state
      defaulterButton.disabled = true;
      defaulterButton.textContent = "⏳ Generating...";

      // Fetch the Excel file
      const response = await fetch(
        `/api/teacher/defaulters/download?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate defaulter list");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `defaulters_threshold_${threshold}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast({
        title: "Success",
        message: "Defaulter list downloaded successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error generating defaulter list:", error);
      showToast({
        title: "Error",
        message: error.message || "Failed to generate defaulter list",
        type: "danger",
      });
    } finally {
      // Reset button state
      defaulterButton.disabled = false;
      defaulterButton.textContent = "📊 Generate Defaulter List";
    }
  });
}

function bootstrap() {
  renderActiveSession();
  attachAttendanceEvents();
  initDialogs();
  initControls();
  initDefaulterButton();
  loadDashboard();
  loadActivity();
}

bootstrap();

import { showToast, apiFetch, formatDateTime, asPercentage } from "./main.js";

const profileId = document.querySelector("[data-profile-id]");
const profileName = document.querySelector("[data-profile-name]");
const profileRoll = document.querySelector("[data-profile-roll]");
const profileStream = document.querySelector("[data-profile-stream]");
const profileDivision = document.querySelector("[data-profile-division]");

const summarySessionsEl = document.querySelector("[data-summary-sessions]");
const summaryPresentEl = document.querySelector("[data-summary-present]");
const summaryPercentageEl = document.querySelector("[data-summary-percentage]");

const progressBar = document.querySelector("[data-progress-bar]");
const progressText = document.querySelector("[data-progress-text]");

const attendanceBody = document.querySelector("[data-attendance-body]");
const monthlyBody = document.querySelector("[data-monthly-body]");

const refreshButton = document.querySelector("[data-refresh]");
const signoutButton = document.querySelector("[data-signout]");

let studentData = null;

function handleError(error, fallback = "Something went wrong") {
  console.error(error);
  showToast({
    title: "Error",
    message: error.message || fallback,
    type: "danger",
  });
}

async function loadDashboard() {
  try {
    const data = await apiFetch("/api/student/dashboard");
    studentData = data.studentInfo || {};

    // Update profile
    profileId.textContent = studentData.id || "–";
    profileName.textContent = studentData.name || "–";
    profileRoll.textContent = studentData.rollNo || "–";
    profileStream.textContent = studentData.stream || "–";
    profileDivision.textContent = studentData.division || "–";

    // Update summary
    const summary = data.summary || {};
    summarySessionsEl.textContent = summary.totalSessions ?? 0;
    summaryPresentEl.textContent = summary.presentCount ?? 0;

    const percentage = summary.percentage ?? 0;
    summaryPercentageEl.textContent = `${percentage}%`;

    // Update progress bar
    progressText.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;

    // Render recent attendance
    renderRecentAttendance(data.recentAttendance || []);

    // Render monthly summary
    renderMonthlySummary(data.monthlySummary || []);
  } catch (error) {
    handleError(error, "Unable to load dashboard");
  }
}

function renderRecentAttendance(records) {
  if (!attendanceBody) return;

  if (!records.length) {
    attendanceBody.innerHTML = `<tr><td colspan="3">No attendance records yet.</td></tr>`;
    return;
  }

  const rows = records
    .map((record) => {
      const statusClass = record.status === "P" ? "success" : "danger";
      const statusText = record.status === "P" ? "Present" : "Absent";

      return `
        <tr>
          <td>${formatDateTime(record.session_date || record.created_at)}</td>
          <td>${record.subject || "–"}</td>
          <td><span class="badge ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    })
    .join("");

  attendanceBody.innerHTML = rows;
}

function renderMonthlySummary(summaries) {
  if (!monthlyBody) return;

  if (!summaries.length) {
    monthlyBody.innerHTML = `<tr><td colspan="5">No data available.</td></tr>`;
    return;
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const rows = summaries
    .map((summary) => {
      const monthName =
        monthNames[summary.month - 1] || `Month ${summary.month}`;
      const present = summary.present_count ?? 0;
      const absent = summary.absent_count ?? 0;
      const total = summary.total_sessions ?? 0;
      const percentage = summary.percentage ?? 0;

      return `
        <tr>
          <td>${monthName} ${summary.year}</td>
          <td>${total}</td>
          <td>${present}</td>
          <td>${absent}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    })
    .join("");

  monthlyBody.innerHTML = rows;
}

function initControls() {
  refreshButton?.addEventListener("click", loadDashboard);

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

function bootstrap() {
  initControls();
  loadDashboard();
}

bootstrap();

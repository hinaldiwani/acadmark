import { apiFetch, showToast, toggleLoading, formatDateTime } from "./main.js";

const statElements = document.querySelectorAll("[data-stat]");
const activityBody = document.querySelector("[data-activity-body]");
const clearActivityButton = document.querySelector("[data-clear-activity]");
const previewArea = document.querySelector("[data-preview-area]");
const previewTable = previewArea?.querySelector("[data-preview-table]");
const previewHead = previewTable?.querySelector("thead");
const previewBody = previewTable?.querySelector("tbody");
const confirmButton = previewArea?.querySelector("[data-confirm-import]");
const stepsList = document.querySelector("[data-import-steps]");
const viewHistoryButton = document.querySelector("[data-view-history]");
const deleteDataButton = document.querySelector("[data-delete-data]");
const historyModal = document.querySelector("[data-history-modal]");
const historyBody = document.querySelector("[data-history-body]");
const closeHistoryButton = document.querySelector("[data-close-history]");
const clearHistoryButton = document.querySelector("[data-clear-history]");

let currentStage = 1;
const importState = {
  students: 0,
  teachers: 0,
};

function updateSteps() {
  if (!stepsList) return;
  const labels = stepsList.querySelectorAll("li");
  labels.forEach((label, index) => {
    const stepNumber = index + 1;
    label.style.opacity = stepNumber <= currentStage ? "1" : "0.45";
    label.style.fontWeight = stepNumber === currentStage ? "600" : "400";
  });
}

async function loadStats() {
  try {
    const data = await apiFetch("/api/admin/stats");
    statElements.forEach((stat) => {
      const key = stat.dataset.stat;
      if (key === "streams") {
        stat.textContent = `${data.streams?.length || 0}`;
      } else {
        stat.textContent = data[key] ?? 0;
      }
    });
  } catch (error) {
    showToast({
      title: "Unable to load stats",
      message: error.message,
      type: "error",
    });
  }
}

function renderPreview(entries) {
  if (!previewArea || !previewTable || !previewHead || !previewBody) return;

  if (!entries || !entries.length) {
    previewTable.style.display = "none";
    confirmButton.style.display = "none";
    return;
  }

  const columns = Object.keys(entries[0]);
  previewHead.innerHTML = `<tr>${columns
    .map((col) => `<th>${col}</th>`)
    .join("")}</tr>`;
  previewBody.innerHTML = entries
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => `<td>${row[col] || ""}</td>`)
          .join("")}</tr>`
    )
    .join("");

  previewTable.style.display = "block";
  confirmButton.style.display = "inline-flex";
}

async function loadActivity() {
  try {
    const { activity } = await apiFetch("/api/admin/activity");
    if (!activity.length) {
      activityBody.innerHTML =
        '<tr><td colspan="3">No recent activity.</td></tr>';
      return;
    }

    activityBody.innerHTML = activity
      .map((item) => {
        const details = (() => {
          try {
            return JSON.parse(item.details || "{}");
          } catch (error) {
            return {};
          }
        })();
        return `
          <tr>
            <td>${formatDateTime(item.created_at)}</td>
            <td>${item.action}</td>
            <td><code>${JSON.stringify(details)}</code></td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    showToast({
      title: "Unable to load activity",
      message: error.message,
      type: "error",
    });
  }
}

function setupUploads() {
  const forms = document.querySelectorAll("[data-upload-form]");
  forms.forEach((form) => {
    const type = form.dataset.uploadForm;
    const input = form.querySelector('input[type="file"]');
    const browseButton = form.querySelector("[data-browse]");
    const fileLabel = form.querySelector("[data-file-name]");

    browseButton?.addEventListener("click", () => input?.click());

    input?.addEventListener("change", () => {
      fileLabel.textContent = input.files?.[0]?.name || "No file selected";
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!input?.files?.length) {
        showToast({
          title: "No file selected",
          message: "Please choose a file first.",
          type: "warning",
        });
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      toggleLoading(submitBtn, true);

      try {
        const formData = new FormData();
        formData.append("file", input.files[0]);

        const endpoint =
          type === "students"
            ? "/api/admin/import/students"
            : "/api/admin/import/teachers";

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message || "Failed to upload file");
        }

        const payload = await response.json();
        renderPreview(payload.preview);

        importState[type] = payload.total;
        currentStage = type === "students" ? 2 : 3;
        updateSteps();

        showToast({
          title: "Upload successful",
          message: `${payload.total} rows ready for review`,
          type: "success",
        });
      } catch (error) {
        showToast({
          title: "Unable to process file",
          message: error.message,
          type: "error",
        });
      } finally {
        toggleLoading(submitBtn, false);
      }
    });
  });
}

confirmButton?.addEventListener("click", async () => {
  toggleLoading(confirmButton, true);
  try {
    const result = await apiFetch("/api/admin/import/confirm", {
      method: "POST",
      body: JSON.stringify({ mappings: [] }),
    });

    renderPreview([]);
    importState.students = 0;
    importState.teachers = 0;
    currentStage = 1;
    updateSteps();

    showToast({
      title: "Import complete",
      message: "All data has been stored safely.",
      type: "success",
    });
    await loadStats();
    await loadActivity();
  } catch (error) {
    showToast({
      title: "Import failed",
      message: error.message,
      type: "error",
    });
  } finally {
    toggleLoading(confirmButton, false);
  }
});

const templateButtons = document.querySelectorAll("[data-download-template]");
templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.downloadTemplate;
    window.open(`/api/admin/templates/${type}`, "_blank");
  });
});

const refreshDashboardButton = document.querySelector(
  "[data-refresh-dashboard]"
);
refreshDashboardButton?.addEventListener("click", loadStats);

const refreshActivityButton = document.querySelector("[data-refresh-activity]");
refreshActivityButton?.addEventListener("click", loadActivity);

clearActivityButton?.addEventListener("click", () => {
  if (!confirm("Are you sure you want to clear the Recent Activity display? This will only clear the display, not delete records from the database.")) {
    return;
  }

  if (activityBody) {
    activityBody.innerHTML = '<tr><td colspan="3">Activity cleared.</td></tr>';
    showToast({
      title: "Cleared",
      message: "Recent activity display has been cleared.",
      type: "success",
    });
  }
});

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

deleteDataButton?.addEventListener("click", async () => {
  const confirmed = confirm(
    "⚠️ WARNING: This will permanently delete ALL data including:\n\n" +
    "• All students\n" +
    "• All teachers\n" +
    "• All attendance sessions and records\n" +
    "• All student-teacher mappings\n" +
    "• All activity logs\n\n" +
    "CSV backup records will be preserved.\n\n" +
    "This action CANNOT be undone. Are you absolutely sure?"
  );

  if (!confirmed) return;

  const doubleConfirmed = confirm(
    "This is your last chance to cancel.\n\n" +
    "Type deletion will proceed in 3 seconds.\n\n" +
    "Click OK to proceed with deletion or Cancel to abort."
  );

  if (!doubleConfirmed) return;

  toggleLoading(deleteDataButton, true);
  try {
    const result = await apiFetch("/api/admin/delete-all-data", {
      method: "POST",
      body: JSON.stringify({}),
    });

    showToast({
      title: "Data deleted successfully",
      message: `Cleared ${result.collectionsCleared?.length || 0} collections`,
      type: "success",
    });

    // Refresh the dashboard
    await loadStats();
    await loadActivity();
  } catch (error) {
    showToast({
      title: "Delete operation failed",
      message: error.message,
      type: "error",
    });
  } finally {
    toggleLoading(deleteDataButton, false);
  }
});

clearHistoryButton?.addEventListener("click", async () => {
  const confirmed = confirm(
    "⚠️ WARNING: This will permanently delete ALL attendance history records including:\n\n" +
    "• All saved Excel/CSV files\n" +
    "• All download links\n" +
    "• All backup attendance data\n\n" +
    "This action CANNOT be undone. Are you sure you want to clear the history?"
  );

  if (!confirmed) return;

  toggleLoading(clearHistoryButton, true);
  try {
    const result = await apiFetch("/api/admin/attendance/clear-history", {
      method: "POST",
      body: JSON.stringify({}),
    });

    showToast({
      title: "History cleared successfully",
      message: `Deleted ${result.recordsDeleted} record(s)`,
      type: "success",
    });

    // Reload the history table to show it's empty
    await loadAttendanceHistory();
  } catch (error) {
    showToast({
      title: "Clear history failed",
      message: error.message,
      type: "error",
    });
  } finally {
    toggleLoading(clearHistoryButton, false);
  }
});
async function loadAttendanceHistory() {
  if (!historyBody) return;

  try {
    historyBody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    const { history } = await apiFetch("/api/admin/attendance/history");

    if (!history || !history.length) {
      historyBody.innerHTML =
        '<tr><td colspan="7">No attendance history found.</td></tr>';
      return;
    }

    const rows = history
      .map((item) => {
        const savedDate = formatDateTime(item.saved_at);
        return `
        <tr>
          <td>${item.filename || "—"}</td>
          <td>${item.teacher_id || "—"}</td>
          <td>${item.subject || "—"}</td>
          <td>${item.stream || "—"}</td>
          <td>${item.division || "—"}</td>
          <td>${savedDate}</td>
          <td>
            <a href="/api/admin/attendance/backup/${item.id
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
      '<tr><td colspan="7">Failed to load history.</td></tr>';
    showToast({
      title: "Unable to load history",
      message: error.message,
      type: "error",
    });
  }
}

const signoutLink = document.querySelector("[data-signout]");
signoutLink?.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  } catch (error) {
    showToast({
      title: "Unable to sign out",
      message: error.message,
      type: "error",
    });
  }
});

updateSteps();
setupUploads();
loadStats();
loadActivity();

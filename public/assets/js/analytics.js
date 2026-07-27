/**
 * GURU-XD Bot Hosting Platform
 * Analytics Page Actions & Charting (Vanilla JS)
 */

let chartsInstances = {};

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Initialize charts and panels
  initAnalyticsCharts();
  populateTopCommands();
  populateGroupActivities();
});

// Timeframe Selector trigger
function loadAnalyticsTimeframe() {
  const select = document.getElementById("timeframe-selector");
  if (!select) return;

  const val = select.value;
  window.AppLoader.show("Running database analytical query...");

  setTimeout(() => {
    window.AppLoader.hide();
    
    // Fluctuated/refresh charts datasets based on selected value
    if (chartsInstances.msgs) {
      const isWeek = val === "7days";
      const isYear = val === "12months";

      const labels = isWeek 
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] 
        : isYear 
          ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          : Array.from({length: 10}, (_, i) => `Day ${3 * (i + 1)}`);

      const data = isWeek 
        ? [120000, 135000, 110000, 142000, 128000, 148000, 155000] 
        : isYear
          ? [2.1, 2.4, 2.8, 3.2, 3.0, 3.4, 3.8, 3.5, 3.9, 4.1, 4.3, 4.6]
          : Array.from({length: 10}, () => 100000 + Math.floor(Math.random() * 50000));

      chartsInstances.msgs.data.labels = labels;
      chartsInstances.msgs.data.datasets[0].data = data;
      chartsInstances.msgs.update();
    }

    window.Toast.success("Charts Updated", `Telemetry parsed successfully for current timeframe window.`);
  }, 1000);
}

// Draw Chart.js graphs
function initAnalyticsCharts() {
  // 1. Messages Per Day Area Chart
  const msgsCtx = document.getElementById("messagesPerDayChart");
  if (msgsCtx) {
    chartsInstances.msgs = new Chart(msgsCtx, {
      type: "line",
      data: {
        labels: ["Day 3", "Day 6", "Day 9", "Day 12", "Day 15", "Day 18", "Day 21", "Day 24", "Day 27", "Day 30"],
        datasets: [{
          label: "Messages Received",
          data: [115000, 128000, 122000, 134000, 142000, 138000, 148000, 154000, 162000, 178000],
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          borderWidth: 2.5,
          tension: 0.35,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: "rgba(44, 59, 85, 0.2)" }, ticks: { color: "#94A3B8" } },
          y: { grid: { color: "rgba(44, 59, 85, 0.2)" }, ticks: { color: "#94A3B8" } }
        }
      }
    });
  }

  // 2. Commands Category Doughnut Chart
  const categoryCtx = document.getElementById("commandsCategoryChart");
  if (categoryCtx) {
    chartsInstances.cats = new Chart(categoryCtx, {
      type: "doughnut",
      data: {
        labels: ["AI", "Downloads", "Groups", "Utilities", "Fun", "Settings"],
        datasets: [{
          data: [25, 38, 15, 12, 8, 2],
          backgroundColor: ["#3B82F6", "#22C55E", "#F59E0B", "#94A3B8", "#A855F7", "#EC4899"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#94A3B8", padding: 16 }
          }
        },
        cutout: "65%"
      }
    });
  }

  // 3. AI Requests Bar Chart
  const aiCtx = document.getElementById("aiRequestsChart");
  if (aiCtx) {
    chartsInstances.ai = new Chart(aiCtx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "GPT / Gemini Queries",
          data: [4250, 4890, 5200, 4980, 5600, 6200, 6500],
          backgroundColor: "#3B82F6",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
          y: { grid: { color: "rgba(44, 59, 85, 0.2)" }, ticks: { color: "#94A3B8" } }
        }
      }
    });
  }

  // 4. Downloads Line Chart
  const dlCtx = document.getElementById("downloadsChart");
  if (dlCtx) {
    chartsInstances.dl = new Chart(dlCtx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Audio Downloads (MP3)",
          data: [1200, 1450, 1580, 1340, 1820, 2100, 2400],
          borderColor: "#22C55E",
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }, {
          label: "Video Downloads (MP4)",
          data: [840, 950, 1100, 1020, 1250, 1420, 1600],
          borderColor: "#F59E0B",
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: "rgba(44, 59, 85, 0.2)" }, ticks: { color: "#94A3B8" } },
          y: { grid: { color: "rgba(44, 59, 85, 0.2)" }, ticks: { color: "#94A3B8" } }
        }
      }
    });
  }
}

// Populate Top Commands Data Grid table
function populateTopCommands() {
  const tbody = document.getElementById("top-commands-table");
  if (!tbody) return;

  const topCmds = [
    { name: ".play", category: "Downloads", dailyAvg: "24.8K calls", rate: "99.98%", load: "HIGH", loadClass: "badge-danger" },
    { name: ".sticker", category: "Utilities", dailyAvg: "18.5K calls", rate: "100%", load: "MEDIUM", loadClass: "badge-warning" },
    { name: ".gpt", category: "AI", dailyAvg: "12.4K calls", rate: "99.92%", load: "HIGH", loadClass: "badge-danger" },
    { name: ".video", category: "Downloads", dailyAvg: "9.5K calls", rate: "99.85%", load: "MEDIUM", loadClass: "badge-warning" },
    { name: ".ping", category: "Utilities", dailyAvg: "8.2K calls", rate: "100%", load: "LOW", loadClass: "badge-success" }
  ];

  tbody.innerHTML = topCmds.map(cmd => `
    <tr>
      <td><code style="font-family: var(--font-mono); font-weight:700; color:#FFFFFF;">${cmd.name}</code></td>
      <td><span class="badge badge-secondary" style="font-size:10px;">${cmd.category}</span></td>
      <td style="font-family: var(--font-mono); font-weight: 500;">${cmd.dailyAvg}</td>
      <td style="font-family: var(--font-mono); color: var(--success-color); font-weight: 600;">${cmd.rate}</td>
      <td><span class="badge ${cmd.loadClass}">${cmd.load}</span></td>
    </tr>
  `).join("");
}

// Group Activites Side lists
function populateGroupActivities() {
  const container = document.getElementById("group-activities-list");
  if (!container) return;

  const groupActs = [
    { text: "Linked <strong>GURU-BOT-01</strong> to 'Anime Hub HQ' group channel.", time: "10m ago", icon: "fa-plus-circle", type: "success" },
    { text: "Spam warning triggered for client 55219983422 in 'Global Group 1'.", time: "1 hour ago", icon: "fa-triangle-exclamation", type: "warning" },
    { text: "Auto Welcomer activated for newly linked 'Dev Chat Community'.", time: "3 hours ago", icon: "fa-toggle-on", type: "success" }
  ];

  container.innerHTML = groupActs.map(act => `
    <li class="activity-item" style="font-size: 12.5px;">
      <div class="activity-dot ${act.type}" style="width: 24px; height: 24px; font-size:10px;">
        <i class="fa-solid ${act.icon}"></i>
      </div>
      <div class="activity-info">
        <div class="activity-desc" style="margin-top:0;">${act.text}</div>
        <div class="activity-time">${act.time}</div>
      </div>
    </li>
  `).join("");
}

// Map callbacks
window.loadAnalyticsTimeframe = loadAnalyticsTimeframe;

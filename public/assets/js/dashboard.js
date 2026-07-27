/**
 * GURU-XD Bot Hosting Platform
 * Dashboard Page Functionality (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Check authorization
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  // Set up profile name in navbar
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Initialize components
  initPerformanceChart();
  populateActivities();
  populateRecentBots();
  populateTerminal();
  
  // Fluctuate resource metrics periodically for realism
  setInterval(fluctuateMetrics, 4000);
});

// Refresh telemetry action
function refreshMetrics() {
  const icon = document.querySelector(".refresh-icon");
  if (icon) icon.style.transform = "rotate(360deg)";
  
  window.Toast.info("Synchronizing metrics", "Fetching real-time load telemetry from servers...");

  setTimeout(() => {
    if (icon) icon.style.transform = "rotate(0deg)";
    
    // Randomize slightly
    document.getElementById("messages-today-val").innerText = (128495 + Math.floor(Math.random() * 250)).toLocaleString();
    document.getElementById("commands-executed-val").innerText = (34185 + Math.floor(Math.random() * 50)).toLocaleString();
    
    fluctuateMetrics();
    window.Toast.success("Metrics Synchronized", "Telemetry successfully updated.");
  }, 1000);
}

// Resource Fluctuations
function fluctuateMetrics() {
  // CPU usage fluctuation
  const cpuVal = 30 + (Math.random() * 30);
  const cpuValStr = cpuVal.toFixed(1) + "%";
  const cpuEl = document.getElementById("cpu-usage-val");
  const cpuBar = document.getElementById("cpu-bar");
  if (cpuEl && cpuBar) {
    cpuEl.innerText = cpuValStr;
    cpuBar.style.width = cpuValStr;
    
    // Change progress colors based on load severity
    cpuBar.className = "progress-bar-fill " + (cpuVal > 80 ? "bg-danger" : cpuVal > 60 ? "bg-warning" : "bg-primary");
  }

  // RAM Usage fluctuation
  const ramUsed = 4.2 + (Math.random() * 1.5);
  const ramPercentage = (ramUsed / 16) * 100;
  const ramEl = document.getElementById("ram-usage-val");
  const ramBar = document.getElementById("ram-bar");
  if (ramEl && ramBar) {
    ramEl.innerText = ramUsed.toFixed(1) + " GB / 16 GB";
    ramBar.style.width = ramPercentage + "%";
  }

  // Network Usage fluctuation
  const netVal = 8.5 + (Math.random() * 12);
  const netEl = document.getElementById("network-usage-val");
  if (netEl) {
    netEl.innerText = netVal.toFixed(1) + " MB/s";
  }
}

// Chart.js Performance Graphs
let performanceChartInstance = null;
function initPerformanceChart() {
  const ctx = document.getElementById("performanceChart");
  if (!ctx) return;

  const data = {
    labels: ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"],
    datasets: [
      {
        label: "CPU Load (%)",
        data: [28, 45, 38, 55, 42, 35],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
      },
      {
        label: "RAM Usage (%)",
        data: [20, 24, 22, 28, 30, 29],
        borderColor: "#22C55E",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
      }
    ]
  };

  performanceChartInstance = new Chart(ctx, {
    type: "line",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Using custom legend in card-title
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(44, 59, 85, 0.2)",
          },
          ticks: {
            color: "#94A3B8"
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: "rgba(44, 59, 85, 0.2)",
          },
          ticks: {
            color: "#94A3B8",
            stepSize: 20
          }
        }
      }
    }
  });
}

// Populate Recent Activity logs
function populateActivities() {
  const container = document.getElementById("activity-list");
  if (!container) return;

  const activities = [
    { type: "success", title: "Bot deployed successfully", desc: "Instance GURU-BOT-01 is online.", time: "10 mins ago", icon: "fa-rocket" },
    { type: "warning", title: "Manual Pairing Required", desc: "GURU-BOT-02 disconnected from WhatsApp web.", time: "1 hour ago", icon: "fa-qrcode" },
    { type: "danger", title: "Server Load Warning", desc: "RAM utilization exceeded 85% on cloud-node-2.", time: "3 hours ago", icon: "fa-triangle-exclamation" },
    { type: "success", title: "Global Backup created", desc: "Stored safely in AWS S3 storage cluster.", time: "12 hours ago", icon: "fa-database" },
  ];

  container.innerHTML = activities.map(item => `
    <li class="activity-item">
      <div class="activity-dot ${item.type}">
        <i class="fa-solid ${item.icon}"></i>
      </div>
      <div class="activity-info">
        <div class="activity-title">${item.title}</div>
        <div class="activity-desc">${item.desc}</div>
        <div class="activity-time">${item.time}</div>
      </div>
    </li>
  `).join("");
}

// Populate Recent Bots Table
function populateRecentBots() {
  const container = document.getElementById("recent-bots-table");
  if (!container) return;

  const bots = [
    { name: "GURU-BOT-01", status: "success", statusText: "ONLINE", users: 18454 },
    { name: "Support-MD", status: "success", statusText: "ONLINE", users: 9542 },
    { name: "Anime-Hub", status: "warning", statusText: "STANDBY", users: 12450 },
    { name: "Downloader-XD", status: "danger", statusText: "OFFLINE", users: 2408 },
  ];

  container.innerHTML = bots.map(bot => `
    <tr>
      <td>
        <div style="font-weight: 600;">${bot.name}</div>
        <div style="font-size: 11px; color: var(--text-secondary);">WhatsApp MD</div>
      </td>
      <td>
        <span class="badge badge-${bot.status}">${bot.statusText}</span>
      </td>
      <td style="font-family: var(--font-mono); font-weight: 500;">
        ${bot.users.toLocaleString()}
      </td>
    </tr>
  `).join("");
}

// Populate Live Terminal Preview with realistic system logs
function populateTerminal() {
  const preview = document.getElementById("terminal-preview");
  if (!preview) return;

  const mockLines = [
    { type: "info", text: "Initializing GURU-XD Core Engine..." },
    { type: "info", text: "Loading plugins database (42 plugins resolved)" },
    { type: "success", text: "WebSocket server established on secure tunnel port 3000" },
    { type: "info", text: "[GURU-BOT-01] Authenticating session hash code..." },
    { type: "success", text: "[GURU-BOT-01] WhatsApp Web Client handshake success!" },
    { type: "info", text: "[Support-MD] Session loaded from server credentials" },
    { type: "success", text: "[Support-MD] Connection opened successfully." },
    { type: "warning", text: "[Downloader-XD] Auth key expired. Pairing requested." },
    { type: "info", text: "System monitoring telemetry started." }
  ];

  let index = 0;
  
  // Render initial lines
  preview.innerHTML = "";
  mockLines.forEach(line => {
    appendTerminalLine(line.type, line.text);
  });

  // Cycle more lines periodically
  const extraLogs = [
    { type: "info", text: "[GURU-BOT-01] Received incoming text command: .menu from 55219983422" },
    { type: "success", text: "[GURU-BOT-01] Responded menu template in 420ms" },
    { type: "info", text: "[Support-MD] Group event triggered: Welcome Message sent to 12015550184" },
    { type: "info", text: "Cache flush completed. Garbage Collector purged 24.2MB" },
    { type: "warning", text: "External API 'YTDL' responded with slow response rate (1.2s delay)" },
    { type: "info", text: "[GURU-BOT-01] Received media request: .play fade to black" },
    { type: "success", text: "[GURU-BOT-01] Media download finished. Sent audio stream successfully." }
  ];

  setInterval(() => {
    const nextLog = extraLogs[index % extraLogs.length];
    appendTerminalLine(nextLog.type, nextLog.text);
    index++;
    // Auto scroll terminal
    preview.scrollTop = preview.scrollHeight;
  }, 5000);
}

function appendTerminalLine(type, text) {
  const preview = document.getElementById("terminal-preview");
  if (!preview) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  const tag = type.toUpperCase();

  const lineEl = document.createElement("div");
  lineEl.className = "term-line";
  lineEl.innerHTML = `
    <span class="term-time">[${timeStr}]</span>
    <span class="term-tag ${type}">[${tag}]</span>
    <span class="term-text">${text}</span>
  `;

  preview.appendChild(lineEl);
}

// Trigger Quick Actions with Confirmation and Toast Notifiers
function triggerQuickAction(action) {
  if (action === "restart_all") {
    window.ConfirmationDialog.show({
      title: "Restart All Bot Instances?",
      message: "This will temporarily disconnect all active chats and reboot the bot execution engines. This process takes approximately 10-15 seconds.",
      confirmText: "Restart All",
      cancelText: "Dismiss",
      onConfirm: () => {
        window.AppLoader.show("Rebooting bot clusters...");
        setTimeout(() => {
          window.AppLoader.hide();
          window.Toast.success("Cluster Rebooted", "All bot containers restarted successfully and connections are re-established.");
        }, 1500);
      }
    });
  } else if (action === "clear_cache") {
    window.ConfirmationDialog.show({
      title: "Purge System Cache?",
      message: "Are you sure you want to clear temporary file caches, media thumbnails, and session logs? Deployed credentials will NOT be touched.",
      confirmText: "Purge",
      cancelText: "Cancel",
      onConfirm: () => {
        window.AppLoader.show("Clearing temporary directories...");
        setTimeout(() => {
          window.AppLoader.hide();
          document.getElementById("storage-usage-val").innerText = "11.2 GB / 100 GB";
          document.getElementById("storage-bar").style.width = "11.2%";
          window.Toast.success("System Cleaned", "Successfully freed 1.2 GB of temporary storage cache.");
        }, 1000);
      }
    });
  } else if (action === "backup") {
    window.AppLoader.show("Packaging instance backup...");
    setTimeout(() => {
      window.AppLoader.show("Uploading encrypted archive to S3...");
      setTimeout(() => {
        window.AppLoader.hide();
        window.Toast.success("Backup Succeeded", "Encrypted backup GURU-XD-BACKUP-2026.zip archived safely.");
      }, 1000);
    }, 1000);
  } else if (action === "reboot_server") {
    window.ConfirmationDialog.show({
      title: "Cold Reboot Base Server?",
      message: "WARNING: A complete server reboot will shut down the Express daemon, terminate all sockets, and cycle the VM. It will disconnect you completely.",
      confirmText: "Force Reboot",
      cancelText: "Cancel",
      onConfirm: () => {
        window.AppLoader.show("Sending ACPI shutdown interrupt...");
        setTimeout(() => {
          window.AppLoader.show("Cycling node clusters...");
          setTimeout(() => {
            window.AppLoader.hide();
            window.Toast.success("Reboot Completed", "Base server cluster cycled successfully. Session re-authorized.");
          }, 1200);
        }, 1200);
      }
    });
  }
}

// Map quick action functions so they can be triggered from HTML elements
window.refreshMetrics = refreshMetrics;
window.triggerQuickAction = triggerQuickAction;

/**
 * GURU-XD Bot Hosting Platform
 * Terminal Logs Specific Logic (Vanilla JS)
 */

let activeLogFilter = "all";
let logsBuffer = [];
let logInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Pre-populate buffer
  generateInitialLogs();
  
  // Render initial buffer
  renderConsoleLogs();

  // Start continuous logging loop
  startLoggingLoop();
});

// Seed Initial log lines
function generateInitialLogs() {
  const seed = [
    { type: "info", tag: "SYSTEM", text: "Initializing GURU-XD Framework Node clusters..." },
    { type: "info", tag: "SYSTEM", text: "Loading system config files from environments" },
    { type: "success", tag: "DATABASE", text: "Successfully connected to SQLite cache segment." },
    { type: "info", tag: "SYSTEM", text: "Compiling active plugins schemas (42 loaded, 0 errors)" },
    { type: "success", tag: "WEBSOCKET", text: "WebSocket server established on port 3000" },
    { type: "info", tag: "GURU-01", text: "Spinning up core Whatsapp client session..." },
    { type: "success", tag: "GURU-01", text: "WhatsApp Client Web MD handshake completed!" },
    { type: "info", tag: "SUPPORT-MD", text: "Session restored from encrypted token storage" },
    { type: "success", tag: "SUPPORT-MD", text: "Linked node active." },
    { type: "warning", tag: "DOWNLOADS", text: "External proxy API 'SaveFrom' returned slow response rate." },
    { type: "info", tag: "GURU-01", text: "Subscribed to 185 groups. Event receivers ready." },
    { type: "info", tag: "ANIME-HUB", text: "Standby mode activated. Session standby." },
    { type: "danger", tag: "WEBSOCKET", text: "Failed to parse session token for down_04 (Purged)." }
  ];

  const now = Date.now();
  logsBuffer = seed.map((log, idx) => {
    const time = new Date(now - (seed.length - idx) * 30000);
    return {
      id: (now - idx).toString(),
      type: log.type === "success" ? "info" : log.type, // map success to info for simplicity but styled custom
      isSuccess: log.type === "success",
      tag: log.tag,
      text: log.text,
      time: time
    };
  });
}

// Draw console screen
function renderConsoleLogs() {
  const terminal = document.getElementById("logs-terminal-screen");
  if (!terminal) return;

  const searchVal = (document.getElementById("log-search")?.value || "").toLowerCase();

  const filtered = logsBuffer.filter(log => {
    const matchesFilter = activeLogFilter === "all" || log.type === activeLogFilter;
    const matchesSearch = log.text.toLowerCase().includes(searchVal) || log.tag.toLowerCase().includes(searchVal);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    terminal.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding-top: 40px; font-style:italic;">-- No logs matched your filter constraints --</div>`;
    return;
  }

  terminal.innerHTML = filtered.map(log => {
    const timeStr = log.time.toTimeString().split(" ")[0];
    const typeLabel = log.isSuccess ? "SUCCESS" : log.type.toUpperCase();
    const typeClass = log.isSuccess ? "success" : log.type;

    return `
      <div class="term-line">
        <span class="term-time">[${timeStr}]</span>
        <span class="term-tag ${typeClass}">[${log.tag}][${typeLabel}]</span>
        <span class="term-text">${log.text}</span>
      </div>
    `;
  }).join("");

  // Handle Autoscroll logic
  const autoToggle = document.getElementById("autoscroll-toggle");
  if (autoToggle && autoToggle.checked) {
    terminal.scrollTop = terminal.scrollHeight;
  }
}

// Streams filtering
function setLogTypeFilter(filter) {
  activeLogFilter = filter;

  const chips = document.querySelectorAll(".category-chip");
  chips.forEach(chip => chip.classList.remove("active"));

  const activeChip = document.getElementById(`lchip-${filter}`);
  if (activeChip) activeChip.classList.add("active");

  renderConsoleLogs();
}

// Clear terminal actions
function clearConsoleLogs() {
  logsBuffer = [];
  renderConsoleLogs();
  window.Toast.info("Terminal Cleared", "Local console log buffers emptied.");
}

// Export files
function downloadLogsText() {
  window.AppLoader.show("Packaging log files...");
  setTimeout(() => {
    window.AppLoader.hide();
    window.Toast.success("Export Success", "Diagnostic log export system file GURU-LOGS-EXPORT.txt downloaded.");
  }, 1000);
}

// Core streaming logs simulation loop
function startLoggingLoop() {
  if (logInterval) clearInterval(logInterval);

  const mockEmissions = [
    { type: "info", tag: "GURU-01", text: "Received text message trigger: .ping from 447700900077" },
    { type: "success", tag: "GURU-01", text: "Responded ping success back in 12ms." },
    { type: "info", tag: "SUPPORT-MD", text: "Group Join detected: New member 12015550184 joined 'Devs Chat'" },
    { type: "info", tag: "SUPPORT-MD", text: "Responded welcome greeting template successfully" },
    { type: "warning", tag: "YTDL", text: "API rate limiting detected. Switching to proxy secondary channel..." },
    { type: "info", tag: "GURU-01", text: "Media request received: .play dance monkey from 55219983422" },
    { type: "success", tag: "GURU-01", text: "Downloaded audio stream (3.2MB). Sent to chat frame." },
    { type: "danger", tag: "DATABASE", text: "Write timeout exceeded on SQLite metrics table." },
    { type: "info", tag: "SYSTEM", text: "Running garbage collector segment cleaner... purges completed." }
  ];

  let idx = 0;

  logInterval = setInterval(() => {
    const rawLog = mockEmissions[idx % mockEmissions.length];
    idx++;

    const newLogObj = {
      id: Date.now().toString(),
      type: rawLog.type === "success" ? "info" : rawLog.type,
      isSuccess: rawLog.type === "success",
      tag: rawLog.tag,
      text: rawLog.text,
      time: new Date()
    };

    logsBuffer.push(newLogObj);
    
    // Cap log buffer size for memory footprint
    if (logsBuffer.length > 200) {
      logsBuffer.shift();
    }

    renderConsoleLogs();
  }, 2500);
}

// Search
function filterLogs() {
  renderConsoleLogs();
}

// Map callbacks
window.clearConsoleLogs = clearConsoleLogs;
window.downloadLogsText = downloadLogsText;
window.setLogTypeFilter = setLogTypeFilter;
window.filterLogs = filterLogs;

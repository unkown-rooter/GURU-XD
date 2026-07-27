/**
 * GURU-XD Bot Hosting Platform
 * Sessions Page Logic (Vanilla JS)
 */

let qrTimerInterval = null;
let countdownSeconds = 45;

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  // Set profile name in navbar
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Populate bot dropdown
  populateBotSelector();

  // Listen to dropdown selection change
  const select = document.getElementById("session-bot-select");
  if (select) {
    select.addEventListener("change", handleBotSelectionChange);
  }

  // Trigger initial render
  handleBotSelectionChange();

  // Start QR refresh timer
  startQRTimer();
});

// Load bots from local storage and fill dropdown select
function populateBotSelector() {
  const select = document.getElementById("session-bot-select");
  if (!select) return;

  const bots = JSON.parse(localStorage.getItem("guru_bots_list")) || [];
  select.innerHTML = bots.map((bot, idx) => `
    <option value="${bot.id}" ${idx === 0 ? "selected" : ""}>${bot.name} (${bot.platform})</option>
  `).join("");
}

// Handle Bot Dropdown changes
function handleBotSelectionChange() {
  const select = document.getElementById("session-bot-select");
  if (!select) return;

  const botId = select.value;
  const bots = JSON.parse(localStorage.getItem("guru_bots_list")) || [];
  const bot = bots.find(b => b.id === botId);

  if (!bot) return;

  // Render status based on bot's active status
  const dot = document.getElementById("status-indicator-dot");
  const text = document.getElementById("status-indicator-text");
  const metaTarget = document.getElementById("meta-target-bot");
  const metaUptime = document.getElementById("meta-uptime");
  const metaLatency = document.getElementById("meta-latency");
  const deviceList = document.getElementById("active-device-list");

  if (metaTarget) metaTarget.innerText = bot.name;

  if (bot.status === "online") {
    if (dot) {
      dot.className = "pulse-indicator";
      dot.style.backgroundColor = "var(--success-color)";
    }
    if (text) {
      text.innerText = "CONNECTED";
      text.style.color = "var(--success-color)";
    }
    if (metaUptime) metaUptime.innerText = "12d 4h 32m";
    if (metaLatency) metaLatency.innerText = "42ms";

    // Populate mock connected device
    if (deviceList) {
      deviceList.innerHTML = `
        <li class="device-item">
          <div class="device-details-wrapper">
            <div class="device-icon-box">
              <i class="fa-solid fa-laptop"></i>
            </div>
            <div class="device-info-text">
              <span class="device-name">Chrome (Ubuntu Linux)</span>
              <span class="device-meta-sub">Active &bull; Munich, Germany</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm text-danger" onclick="logoutDevice('${bot.id}')" style="border-color: rgba(239,68,68,0.2);">
            Disconnect Node
          </button>
        </li>
      `;
    }
  } else {
    // Standby or offline
    if (dot) {
      dot.className = "";
      dot.style.backgroundColor = "var(--danger-color)";
    }
    if (text) {
      text.innerText = bot.status === "standby" ? "STANDBY (PAIRING)" : "DISCONNECTED";
      text.style.color = bot.status === "standby" ? "var(--warning-color)" : "var(--danger-color)";
    }
    if (metaUptime) metaUptime.innerText = "--";
    if (metaLatency) metaLatency.innerText = "--";

    if (deviceList) {
      deviceList.innerHTML = `
        <li style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px;">
          <i class="fa-solid fa-ban" style="font-size: 24px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
          No linked device sessions found for this container. Scan the QR code or use pairing code to link.
        </li>
      `;
    }
  }
}

// Switch between scan QR and code input tabs
function switchAuthTab(tab) {
  const qrTab = document.getElementById("qr-tab-btn");
  const codeTab = document.getElementById("code-tab-btn");
  const qrContent = document.getElementById("qr-tab-content");
  const codeContent = document.getElementById("code-tab-content");

  if (tab === "qr") {
    qrTab.classList.add("active");
    codeTab.classList.remove("active");
    qrContent.style.display = "block";
    codeContent.style.display = "none";
  } else {
    qrTab.classList.remove("active");
    codeTab.classList.add("active");
    qrContent.style.display = "none";
    codeContent.style.display = "block";
  }
}

// QR timer loop
function startQRTimer() {
  const timerLabel = document.getElementById("qr-timer");
  if (!timerLabel) return;

  if (qrTimerInterval) clearInterval(qrTimerInterval);

  countdownSeconds = 45;
  qrTimerInterval = setInterval(() => {
    countdownSeconds--;
    timerLabel.innerHTML = `Refresh in <strong>${countdownSeconds}s</strong>`;

    if (countdownSeconds <= 0) {
      regenerateQR();
    }
  }, 1000);
}

// Regenerate QR action
function regenerateQR() {
  const overlay = document.getElementById("qr-overlay-status");
  const qrImg = document.getElementById("qr-image");

  if (overlay) overlay.style.display = "flex";

  setTimeout(() => {
    // Shift hash to load a slightly fresh mock QR
    const freshDataHash = "GURU-XD-MOCK-SESSION-HASH-" + Date.now();
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${freshDataHash}`;
    }
    if (overlay) overlay.style.display = "none";
    
    window.Toast.success("Secure Socket Handshake Created", "A fresh WhatsApp Web QR code was requested and loaded.");
    startQRTimer();
  }, 1000);
}

// Request WhatsApp Pairing Code
function requestPairingCode() {
  const phoneInput = document.getElementById("pairing-phone");
  const codeBox = document.getElementById("code-display-box");
  const codeVal = document.getElementById("generated-code-val");

  if (!phoneInput || !phoneInput.value.trim()) {
    window.Toast.warning("Phone Required", "Please input a valid international phone number to link your session.");
    return;
  }

  window.AppLoader.show("Broadcasting pairing handshakes...");
  
  setTimeout(() => {
    window.AppLoader.hide();
    
    // Generate a random high-quality WhatsApp pairing code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code1 = "";
    let code2 = "";
    for (let i = 0; i < 4; i++) {
      code1 += chars.charAt(Math.floor(Math.random() * chars.length));
      code2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalCode = `${code1}-${code2}`;

    if (codeVal) codeVal.innerText = finalCode;
    if (codeBox) codeBox.style.display = "block";

    window.Toast.success("Pairing Code Ready", "Please input this pairing code into your active WhatsApp linked devices prompt.");
    
    // Simulate connection after 10 seconds for realistic feedback!
    setTimeout(() => {
      simulateConnectionSuccess();
    }, 10000);

  }, 1500);
}

// Simulate successful code input on mobile phone
function simulateConnectionSuccess() {
  const select = document.getElementById("session-bot-select");
  if (!select) return;

  const botId = select.value;
  const bots = JSON.parse(localStorage.getItem("guru_bots_list")) || [];
  const botIndex = bots.findIndex(b => b.id === botId);

  if (botIndex === -1) return;

  const bot = bots[botIndex];
  if (bot.status !== "online") {
    bot.status = "online";
    localStorage.setItem("guru_bots_list", JSON.stringify(bots));
    
    // Refresh page details
    handleBotSelectionChange();
    window.Toast.success("Node Linked Successfully", `${bot.name} is now connected through Multi-Device sockets!`);
    
    // Hide pairing box
    const codeBox = document.getElementById("code-display-box");
    if (codeBox) codeBox.style.display = "none";
  }
}

// Copy Code Clipboard Utility
function copyPairingCode() {
  const code = document.getElementById("generated-code-val")?.innerText;
  if (!code) return;

  navigator.clipboard.writeText(code).then(() => {
    window.Toast.success("Copied", "Pairing code successfully copied to clipboard.");
  }).catch(() => {
    window.Toast.danger("Failed to Copy", "Please copy the text manually from the screen.");
  });
}

// Logout Connected Devices with dynamic dialog triggers
function logoutDevice(botId) {
  const bots = JSON.parse(localStorage.getItem("guru_bots_list")) || [];
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;

  window.ConfirmationDialog.show({
    title: "Terminate Device Link?",
    message: `This will actively logout GURU-XD from WhatsApp session Chrome (Ubuntu Linux) for ${bot.name}.`,
    confirmText: "Disconnect",
    cancelText: "Keep Connected",
    onConfirm: () => {
      window.AppLoader.show("Broadcasting logout sockets...");
      setTimeout(() => {
        // Change status to offline
        const botIndex = bots.findIndex(b => b.id === botId);
        if (botIndex !== -1) {
          bots[botIndex].status = "offline";
          localStorage.setItem("guru_bots_list", JSON.stringify(bots));
        }
        
        handleBotSelectionChange();
        window.AppLoader.hide();
        window.Toast.warning("Device Disconnected", `Session disconnected. ${bot.name} is now offline.`);
      }, 1000);
    }
  });
}

// Export for global HTML hooks
window.switchAuthTab = switchAuthTab;
window.regenerateQR = regenerateQR;
window.requestPairingCode = requestPairingCode;
window.copyPairingCode = copyPairingCode;
window.logoutDevice = logoutDevice;

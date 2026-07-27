/**
 * GURU-XD Bot Hosting Platform
 * Bots Page Actions & State Management (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Check authorization
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  // Set up profile info in navbar
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Set up Initial mock data if not stored in localStorage
  if (!localStorage.getItem("guru_bots_list")) {
    const defaultBotsList = [
      { id: "1", name: "GURU-BOT-01", platform: "WhatsApp MD", status: "online", prefix: ".", users: 18454, created: "2026-05-12", owner: "12015550184", autoTyping: true, autoRead: true },
      { id: "2", name: "Support-MD", platform: "WhatsApp MD", status: "online", prefix: "!", users: 9542, created: "2026-06-01", owner: "447700900077", autoTyping: true, autoRead: false },
      { id: "3", name: "Anime-Hub", platform: "WhatsApp MD", status: "standby", prefix: "/", users: 12450, created: "2026-06-14", owner: "55219983422", autoTyping: false, autoRead: false },
      { id: "4", name: "Downloader-XD", platform: "WhatsApp MD", status: "offline", prefix: ".", users: 2408, created: "2026-07-02", owner: "62812345678", autoTyping: false, autoRead: false },
      { id: "5", name: "Telegram-Helper", platform: "Telegram Bot", status: "online", prefix: "/", users: 450, created: "2026-07-10", owner: "guru_tg_api", autoTyping: true, autoRead: true }
    ];
    localStorage.setItem("guru_bots_list", JSON.stringify(defaultBotsList));
  }

  // Load and Render
  renderBotsTable();

  // Setup Modal Handlers
  const modal = new window.UIModal("bot-form-modal");
  
  const openModalBtns = [
    document.getElementById("open-create-modal-btn"),
    document.getElementById("floating-create-btn")
  ];

  openModalBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        document.getElementById("bot-edit-id").value = "";
        document.getElementById("bot-instance-form").reset();
        document.getElementById("modal-form-title").innerText = "Deploy De Novo Bot";
        document.getElementById("modal-submit-btn").innerText = "Authorize Deployment";
        modal.show();
      });
    }
  });

  // Setup form submission
  const botForm = document.getElementById("bot-instance-form");
  if (botForm) {
    botForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveBotInstance(modal);
    });
  }

  // Setup live search and status filters
  const searchInput = document.getElementById("bot-search");
  const platformFilter = document.getElementById("platform-filter");
  const statusFilter = document.getElementById("status-filter");

  if (searchInput) searchInput.addEventListener("input", renderBotsTable);
  if (platformFilter) platformFilter.addEventListener("change", renderBotsTable);
  if (statusFilter) statusFilter.addEventListener("change", renderBotsTable);
});

// Retrieve bots from local state
function getBotsList() {
  return JSON.parse(localStorage.getItem("guru_bots_list")) || [];
}

// Persist bots to local state
function saveBotsList(list) {
  localStorage.setItem("guru_bots_list", JSON.stringify(list));
}

// Render Table Rows with dynamic controls
function renderBotsTable() {
  const tableBody = document.getElementById("bots-table-body");
  if (!tableBody) return;

  const bots = getBotsList();
  
  // Apply Search & Filters
  const searchVal = (document.getElementById("bot-search")?.value || "").toLowerCase();
  const platformVal = document.getElementById("platform-filter")?.value || "all";
  const statusVal = document.getElementById("status-filter")?.value || "all";

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchVal) || bot.owner.toLowerCase().includes(searchVal);
    
    let matchesPlatform = true;
    if (platformVal !== "all") {
      if (platformVal === "whatsapp" && bot.platform !== "WhatsApp MD") matchesPlatform = false;
      if (platformVal === "telegram" && bot.platform !== "Telegram Bot") matchesPlatform = false;
      if (platformVal === "discord" && bot.platform !== "Discord App") matchesPlatform = false;
    }

    let matchesStatus = true;
    if (statusVal !== "all") {
      if (statusVal === "online" && bot.status !== "online") matchesStatus = false;
      if (statusVal === "standby" && bot.status !== "standby") matchesStatus = false;
      if (statusVal === "offline" && bot.status !== "offline") matchesStatus = false;
    }

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  if (filteredBots.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
          No matching bot instances deployed in this node sector.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredBots.map(bot => {
    // Set status badge style
    let badgeClass = "badge-secondary";
    let statusLabel = "OFFLINE";
    if (bot.status === "online") { badgeClass = "badge-success"; statusLabel = "ONLINE"; }
    else if (bot.status === "standby") { badgeClass = "badge-warning"; statusLabel = "STANDBY"; }

    // Set buttons based on status
    const isOnline = bot.status === "online";
    const statusBtn = isOnline 
      ? `<button class="action-icon-btn stop-btn" onclick="toggleBotStatus('${bot.id}', 'stop')" title="Stop Bot"><i class="fa-solid fa-stop"></i></button>`
      : `<button class="action-icon-btn start-btn" onclick="toggleBotStatus('${bot.id}', 'start')" title="Start Bot"><i class="fa-solid fa-play"></i></button>`;

    return `
      <tr>
        <td>
          <div class="bot-info">
            <div class="bot-avatar">
              <i class="fa-solid ${bot.platform === "Telegram Bot" ? "fa-paper-plane" : bot.platform === "Discord App" ? "fa-circle-dot" : "fa-robot"}"></i>
            </div>
            <div class="bot-meta">
              <span class="bot-display-name">${bot.name}</span>
              <span class="bot-owner-num">Owner: ${bot.owner}</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 13px; font-weight: 500;">${bot.platform}</span>
        </td>
        <td>
          <span class="badge ${badgeClass}">${statusLabel}</span>
        </td>
        <td>
          <code style="font-family: var(--font-mono); font-weight: bold; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">${bot.prefix}</code>
        </td>
        <td style="font-family: var(--font-mono); font-weight: 500;">
          ${bot.users.toLocaleString()}
        </td>
        <td style="font-size: 13px; color: var(--text-secondary);">
          ${bot.created}
        </td>
        <td>
          <div class="row-actions-wrapper">
            ${statusBtn}
            <button class="action-icon-btn restart-btn" onclick="toggleBotStatus('${bot.id}', 'restart')" title="Restart Container" ${!isOnline ? "disabled style='opacity:0.3; cursor:not-allowed;'" : ""}><i class="fa-solid fa-arrows-rotate"></i></button>
            <button class="action-icon-btn edit-btn" onclick="openEditBotModal('${bot.id}')" title="Configure Bot"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="action-icon-btn delete-btn" onclick="deleteBotInstance('${bot.id}')" title="Terminate Bot"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Toggle Start, Stop, Restart actions
function toggleBotStatus(id, action) {
  const bots = getBotsList();
  const botIndex = bots.findIndex(b => b.id === id);
  if (botIndex === -1) return;

  const bot = bots[botIndex];

  if (action === "start") {
    window.AppLoader.show(`Spinning up ${bot.name} container...`);
    setTimeout(() => {
      bot.status = "online";
      saveBotsList(bots);
      renderBotsTable();
      window.AppLoader.hide();
      window.Toast.success("Container Online", `${bot.name} container initialized and connected successfully.`);
    }, 1200);
  } else if (action === "stop") {
    window.AppLoader.show(`Halting ${bot.name} execution daemon...`);
    setTimeout(() => {
      bot.status = "offline";
      saveBotsList(bots);
      renderBotsTable();
      window.AppLoader.hide();
      window.Toast.warning("Container Offline", `${bot.name} stopped.`);
    }, 1000);
  } else if (action === "restart") {
    window.AppLoader.show(`Cycling ${bot.name} instance...`);
    setTimeout(() => {
      bot.status = "online";
      saveBotsList(bots);
      renderBotsTable();
      window.AppLoader.hide();
      window.Toast.success("Container Cycled", `${bot.name} completed cold reboot loop.`);
    }, 1200);
  }
}

// Create or Edit Save Action
function saveBotInstance(modalInstance) {
  const editId = document.getElementById("bot-edit-id").value;
  const name = document.getElementById("bot-name").value.trim();
  const platform = document.getElementById("bot-platform").value;
  const prefix = document.getElementById("bot-prefix").value.trim();
  const owner = document.getElementById("bot-owner").value.trim();
  const autoTyping = document.getElementById("bot-auto-typing").checked;
  const autoRead = document.getElementById("bot-auto-read").checked;

  const bots = getBotsList();

  if (editId) {
    // Edit existing
    const index = bots.findIndex(b => b.id === editId);
    if (index !== -1) {
      bots[index] = { ...bots[index], name, platform, prefix, owner, autoTyping, autoRead };
      saveBotsList(bots);
      window.Toast.success("Configuration Updated", `Bot '${name}' configurations updated in core files.`);
    }
  } else {
    // Create new
    const newBot = {
      id: Date.now().toString(),
      name,
      platform,
      status: "offline", // Initial offline for pairing session
      prefix,
      users: 0,
      created: new Date().toISOString().split("T")[0],
      owner,
      autoTyping,
      autoRead
    };
    bots.push(newBot);
    saveBotsList(bots);
    window.Toast.success("Deployment Authorized", `Created offline container ${name}. Proceed to 'Sessions' to connect.`);
  }

  modalInstance.hide();
  renderBotsTable();
}

// Open modal for editing
function openEditBotModal(id) {
  const bots = getBotsList();
  const bot = bots.find(b => b.id === id);
  if (!bot) return;

  document.getElementById("bot-edit-id").value = bot.id;
  document.getElementById("bot-name").value = bot.name;
  document.getElementById("bot-platform").value = bot.platform;
  document.getElementById("bot-prefix").value = bot.prefix;
  document.getElementById("bot-owner").value = bot.owner;
  document.getElementById("bot-auto-typing").checked = bot.autoTyping;
  document.getElementById("bot-auto-read").checked = bot.autoRead;

  document.getElementById("modal-form-title").innerText = `Configure ${bot.name}`;
  document.getElementById("modal-submit-btn").innerText = "Save Configuration";

  const modal = new window.UIModal("bot-form-modal");
  modal.show();
}

// Delete / Terminate Instance with Confirmation Dialogue
function deleteBotInstance(id) {
  const bots = getBotsList();
  const bot = bots.find(b => b.id === id);
  if (!bot) return;

  window.ConfirmationDialog.show({
    title: `Terminate ${bot.name}?`,
    message: `This will completely delete the bot container files, session hashes, and local database segments. This operation is absolutely irreversible.`,
    confirmText: "Terminate Bot",
    cancelText: "Cancel",
    onConfirm: () => {
      window.AppLoader.show(`Destroying ${bot.name} container filesystem...`);
      setTimeout(() => {
        const updated = bots.filter(b => b.id !== id);
        saveBotsList(updated);
        renderBotsTable();
        window.AppLoader.hide();
        window.Toast.danger("Instance Destroyed", `Successfully purged all directory structures for ${bot.name}.`);
      }, 1000);
    }
  });
}

// Make callback functions globally available for inline HTML listeners
window.toggleBotStatus = toggleBotStatus;
window.openEditBotModal = openEditBotModal;
window.deleteBotInstance = deleteBotInstance;

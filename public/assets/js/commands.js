/**
 * GURU-XD Bot Hosting Platform
 * Commands Controller Actions & State (Vanilla JS)
 */

let selectedCategory = "all";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  // Set navbar username
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Initialize mock commands in local storage
  if (!localStorage.getItem("guru_commands_list")) {
    const defaultCommands = [
      { id: "1", name: ".gpt", category: "AI", desc: "Interact with Gemini/ChatGPT AI. Proxy server handles text requests.", active: true, count: 12480 },
      { id: "2", name: ".dalle", category: "AI", desc: "Generate premium images from text prompts using DALL-E models.", active: true, count: 4850 },
      { id: "3", name: ".play", category: "Downloads", desc: "Search and download audio from YouTube. Autoconverts stream to high-quality MP3.", active: true, count: 24890 },
      { id: "4", name: ".video", category: "Downloads", desc: "Download videos directly from Instagram, TikTok, or YouTube (MP4).", active: true, count: 18450 },
      { id: "5", name: ".kick", category: "Groups", desc: "Kick a participant from the WhatsApp group. Requires admin status.", active: true, count: 1280 },
      { id: "6", name: ".add", category: "Groups", desc: "Add a mobile number directly to the current group.", active: false, count: 420 },
      { id: "7", name: ".exec", category: "Owner", desc: "Execute custom terminal bash commands straight from chat terminal (Owner only).", active: true, count: 185 },
      { id: "8", name: ".eval", category: "Owner", desc: "Evaluate custom server-side JavaScript codes inside isolated nodes.", active: true, count: 320 },
      { id: "9", name: ".sticker", category: "Utilities", desc: "Convert media files (images, short videos) into WhatsApp web stickers.", active: true, count: 35890 },
      { id: "10", name: ".ping", category: "Utilities", desc: "Measures response latency and container uptime metrics.", active: true, count: 9840 },
      { id: "11", name: ".meme", category: "Fun", desc: "Generate randomized memes or edit visual media with custom titles.", active: true, count: 4520 },
      { id: "12", name: ".welcome", category: "Settings", desc: "Toggle welcome triggers when new users enter groups.", active: false, count: 1210 }
    ];
    localStorage.setItem("guru_commands_list", JSON.stringify(defaultCommands));
  }

  // Initial render
  renderCommands();

  // Search input change listener
  const searchInput = document.getElementById("cmd-search");
  if (searchInput) {
    searchInput.addEventListener("input", renderCommands);
  }

  // Set up Add Command modal
  const addModal = new window.UIModal("add-cmd-modal");
  const addForm = document.getElementById("add-cmd-form");
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveNewCommand(addModal);
    });
  }
});

// Retrieve commands
function getCommands() {
  return JSON.parse(localStorage.getItem("guru_commands_list")) || [];
}

// Render grid
function renderCommands() {
  const container = document.getElementById("commands-container");
  if (!container) return;

  const commands = getCommands();
  const searchVal = (document.getElementById("cmd-search")?.value || "").toLowerCase();

  const filtered = commands.filter(cmd => {
    const matchesCategory = selectedCategory === "all" || cmd.category === selectedCategory;
    const matchesSearch = cmd.name.toLowerCase().includes(searchVal) || cmd.desc.toLowerCase().includes(searchVal);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
        No commands found matching filters.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(cmd => `
    <div class="card command-item-card">
      <div>
        <div class="cmd-header">
          <span class="cmd-trigger-text">${cmd.name}</span>
          <span class="category-tag ${cmd.category.toLowerCase()}">${cmd.category}</span>
        </div>
        <p class="cmd-desc-text">${cmd.desc}</p>
      </div>
      
      <div class="cmd-footer">
        <div class="cmd-counter-badge">
          <i class="fa-solid fa-chart-simple"></i>
          <span>${cmd.count.toLocaleString()} calls</span>
        </div>
        
        <label class="switch">
          <input type="checkbox" ${cmd.active ? "checked" : ""} onclick="toggleCommandStatus('${cmd.id}', this)">
          <span class="slider"></span>
        </label>
      </div>
    </div>
  `).join("");
}

// Toggle Command Active
function toggleCommandStatus(id, switchEl) {
  const commands = getCommands();
  const idx = commands.findIndex(c => c.id === id);
  if (idx === -1) return;

  const active = switchEl.checked;
  commands[idx].active = active;
  localStorage.setItem("guru_commands_list", JSON.stringify(commands));

  const trigger = commands[idx].name;
  if (active) {
    window.Toast.success("Command Activated", `Trigger '${trigger}' is now globally active.`);
  } else {
    window.Toast.warning("Command Deactivated", `Trigger '${trigger}' is now suspended globally.`);
  }
}

// Filter category chips
function filterCategory(category) {
  selectedCategory = category;

  // Toggle active class on buttons
  const chips = document.querySelectorAll(".category-chip");
  chips.forEach(chip => {
    chip.classList.remove("active");
  });

  const activeChip = document.getElementById(`chip-${category}`);
  if (activeChip) activeChip.classList.add("active");

  renderCommands();
}

// Launch Modal
function addNewCommand() {
  const modal = new window.UIModal("add-cmd-modal");
  modal.show();
}

// Save added command
function saveNewCommand(modalInstance) {
  const name = document.getElementById("cmd-name").value.trim();
  const category = document.getElementById("cmd-category").value;
  const desc = document.getElementById("cmd-desc").value.trim();

  if (!name.startsWith(".")) {
    window.Toast.warning("Format Warning", "We recommend starting command triggers with a dot prefix (ex: .menu)");
  }

  const commands = getCommands();
  const newCmd = {
    id: Date.now().toString(),
    name,
    category,
    desc,
    active: true,
    count: 0
  };

  commands.push(newCmd);
  localStorage.setItem("guru_commands_list", JSON.stringify(commands));

  window.Toast.success("Command Registered", `Trigger '${name}' successfully configured into ${category}.`);
  modalInstance.hide();
  renderCommands();
}

// Map callbacks globally
window.filterCategory = filterCategory;
window.toggleCommandStatus = toggleCommandStatus;
window.addNewCommand = addNewCommand;

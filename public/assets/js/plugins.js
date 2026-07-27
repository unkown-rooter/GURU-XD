/**
 * GURU-XD Bot Hosting Platform
 * Plugins Page Specific Logic & State (Vanilla JS)
 */

let activePluginTab = "installed";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Setup Initial Mock Plugins in localStorage
  if (!localStorage.getItem("guru_installed_plugins")) {
    const defaultInstalled = [
      { id: "1", name: "ytdl-core-ext", desc: "Allows high-speed downloads from audio/video channels with retry queues.", category: "Downloads", version: "v1.4.2", author: "GURU Devs", active: true },
      { id: "2", name: "openai-gpt4-chat", desc: "Integrates OpenAI chat capabilities. Autoproxies API requests server-side.", category: "AI", version: "v2.1.0", author: "OpenAI Community", active: true },
      { id: "3", name: "auto-sticker-creator", desc: "Automatically converts group incoming photos into funny chat stickers.", category: "Utilities", version: "v1.0.5", author: "StickerCo", active: true },
      { id: "4", name: "anti-spam-shield", desc: "Auto kick users spamming same messages or links in group configurations.", category: "Groups", version: "v3.0.1", author: "SecurityNode", active: false },
      { id: "5", name: "fun-meme-generator", desc: "Injects anime, gaming, and viral memes search directly into chat commands.", category: "Fun", version: "v1.1.2", author: "GURU Devs", active: true },
      { id: "6", name: "server-metrics-reporter", desc: "Periodically logs server memory and CPU metrics into console panels.", category: "Settings", version: "v1.0.0", author: "CloudNode", active: true }
    ];
    localStorage.setItem("guru_installed_plugins", JSON.stringify(defaultInstalled));
  }

  if (!localStorage.getItem("guru_marketplace_plugins")) {
    const defaultMarketplace = [
      { id: "m1", name: "instagram-scrapper", desc: "Download high quality reels and posts stories with single URL link.", category: "Downloads", version: "v1.2.0", author: "InstaPlus", installed: false },
      { id: "m2", name: "midjourney-upscaler", desc: "Generate ultra realistic image arts and upscale them inside your chats.", category: "AI", version: "v2.0.0", author: "ArtStudio", installed: false },
      { id: "m3", name: "group-welcomer-md", desc: "Greet new joined members with beautiful customizable greeting banners.", category: "Groups", version: "v1.4.0", author: "WhatsAppDevs", installed: false },
      { id: "m4", name: "crypto-rates-tracker", desc: "Live prices monitor for BTC, ETH, and other crypto assets directly.", category: "Utilities", version: "v1.1.0", author: "BinanceFans", installed: false },
      { id: "m5", name: "soundboard-synthesizer", desc: "Play custom synth audios or voicenotes during group voice chats.", category: "Fun", version: "v2.2.1", author: "LyriaCo", installed: false }
    ];
    localStorage.setItem("guru_marketplace_plugins", JSON.stringify(defaultMarketplace));
  }

  // Initial rendering
  renderInstalled();
  renderMarketplace();

  // Setup Drag & Drop File Uploads
  setupDragAndDrop();
});

// Retrieve sets
function getInstalledPlugins() {
  return JSON.parse(localStorage.getItem("guru_installed_plugins")) || [];
}

function getMarketplacePlugins() {
  return JSON.parse(localStorage.getItem("guru_marketplace_plugins")) || [];
}

// Render Installed Tab
function renderInstalled() {
  const container = document.getElementById("installed-plugins-container");
  if (!container) return;

  const plugins = getInstalledPlugins();
  const tabButton = document.getElementById("installed-tab-btn");
  if (tabButton) tabButton.innerText = `Installed Modules (${plugins.length})`;

  container.innerHTML = plugins.map(p => `
    <div class="card plugin-card">
      <div class="plugin-content">
        <div class="plugin-head-details">
          <div class="plugin-meta-wrapper">
            <span class="plugin-display-name">${p.name}</span>
            <span class="plugin-version-text">${p.version} &bull; ${p.category}</span>
          </div>
        </div>
        <p class="plugin-desc">${p.desc}</p>
        <span class="plugin-author-label">Developed by ${p.author}</span>
      </div>

      <div class="plugin-footer">
        <label class="switch" title="Toggle plugin status">
          <input type="checkbox" ${p.active ? "checked" : ""} onclick="togglePluginActive('${p.id}', this)">
          <span class="slider"></span>
        </label>

        <div class="plugin-actions">
          <button class="btn btn-outline btn-sm" onclick="updatePlugin('${p.id}')" title="Check updates"><i class="fa-solid fa-cloud-arrow-down text-primary"></i></button>
          <button class="btn btn-outline btn-sm" onclick="deletePlugin('${p.id}')" title="Delete plugin"><i class="fa-solid fa-trash-can text-danger"></i></button>
        </div>
      </div>
    </div>
  `).join("");
}

// Render Marketplace Tab
function renderMarketplace() {
  const container = document.getElementById("market-plugins-container");
  if (!container) return;

  const market = getMarketplacePlugins();
  const searchVal = (document.getElementById("market-search")?.value || "").toLowerCase();

  const filtered = market.filter(p => {
    return p.name.toLowerCase().includes(searchVal) || p.desc.toLowerCase().includes(searchVal) || p.author.toLowerCase().includes(searchVal);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
        No extensions found matching search criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="card plugin-card">
      <div class="plugin-content">
        <div class="plugin-head-details">
          <div class="plugin-meta-wrapper">
            <span class="plugin-display-name">${p.name}</span>
            <span class="plugin-version-text">${p.version} &bull; ${p.category}</span>
          </div>
        </div>
        <p class="plugin-desc">${p.desc}</p>
        <span class="plugin-author-label">Developed by ${p.author}</span>
      </div>

      <div class="plugin-footer" style="justify-content: flex-end;">
        ${p.installed 
          ? `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-circle-check text-success"></i> Installed</button>`
          : `<button class="btn btn-primary btn-sm" onclick="installMarketplacePlugin('${p.id}', this)"><i class="fa-solid fa-circle-down"></i> Install</button>`
        }
      </div>
    </div>
  `).join("");
}

// Switch tabs
function switchPluginTab(tab) {
  activePluginTab = tab;
  const instBtn = document.getElementById("installed-tab-btn");
  const markBtn = document.getElementById("market-tab-btn");
  const instCont = document.getElementById("installed-tab-content");
  const markCont = document.getElementById("market-tab-content");

  if (tab === "installed") {
    instBtn.classList.add("active");
    markBtn.classList.remove("active");
    instCont.style.display = "block";
    markCont.style.display = "none";
  } else {
    instBtn.classList.remove("active");
    markBtn.classList.add("active");
    instCont.style.display = "none";
    markCont.style.display = "block";
  }
}

// Toggle Plugin State (Active / Suspended)
function togglePluginActive(id, switchEl) {
  const list = getInstalledPlugins();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return;

  const state = switchEl.checked;
  list[idx].active = state;
  localStorage.setItem("guru_installed_plugins", JSON.stringify(list));

  const name = list[idx].name;
  if (state) {
    window.Toast.success("Extension Loaded", `Module '${name}' hot-loaded successfully into active containers.`);
  } else {
    window.Toast.warning("Extension Suspended", `Module '${name}' unloaded from active containers.`);
  }
}

// Install plugin from marketplace
function installMarketplacePlugin(id, btnEl) {
  const market = getMarketplacePlugins();
  const mIndex = market.findIndex(p => p.id === id);
  if (mIndex === -1) return;

  const item = market[mIndex];
  
  // Set installing state on button
  btnEl.disabled = true;
  btnEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Downloading...`;

  setTimeout(() => {
    // Install in locally installed set
    const installed = getInstalledPlugins();
    installed.push({
      id: Date.now().toString(),
      name: item.name,
      desc: item.desc,
      category: item.category,
      version: item.version,
      author: item.author,
      active: true
    });
    
    // Mark marketplace as installed
    item.installed = true;
    
    localStorage.setItem("guru_installed_plugins", JSON.stringify(installed));
    localStorage.setItem("guru_marketplace_plugins", JSON.stringify(market));

    window.Toast.success("Extension Installed", `Successfully downloaded and initialized module '${item.name}'`);
    
    renderInstalled();
    renderMarketplace();
  }, 1500);
}

// Update check
function updatePlugin(id) {
  const installed = getInstalledPlugins();
  const item = installed.find(p => p.id === id);
  if (!item) return;

  window.AppLoader.show(`Checking update repositories for ${item.name}...`);
  setTimeout(() => {
    window.AppLoader.hide();
    window.Toast.success("Latest Version", `${item.name} is already using the most stable version (${item.version}).`);
  }, 1000);
}

// Delete plugin with confirmation dialog
function deletePlugin(id) {
  const installed = getInstalledPlugins();
  const item = installed.find(p => p.id === id);
  if (!item) return;

  window.ConfirmationDialog.show({
    title: `Uninstall ${item.name}?`,
    message: `This will completely delete the code module '${item.name}.js' from active systems. Subsystems using this command registry will be halted.`,
    confirmText: "Uninstall",
    cancelText: "Keep Module",
    onConfirm: () => {
      window.AppLoader.show(`Unloading files for ${item.name}...`);
      setTimeout(() => {
        const updated = installed.filter(p => p.id !== id);
        localStorage.setItem("guru_installed_plugins", JSON.stringify(updated));
        
        // Reset marketplace status if it was from there
        const market = getMarketplacePlugins();
        const mIdx = market.findIndex(m => m.name === item.name);
        if (mIdx !== -1) {
          market[mIdx].installed = false;
          localStorage.setItem("guru_marketplace_plugins", JSON.stringify(market));
        }

        renderInstalled();
        renderMarketplace();
        window.AppLoader.hide();
        window.Toast.danger("Extension Uninstalled", `Successfully purged files for '${item.name}'.`);
      }, 800);
    }
  });
}

// Drag & Drop handlers
function setupDragAndDrop() {
  const dragArea = document.getElementById("plugin-drag-area");
  const fileInput = document.getElementById("plugin-file-input");

  if (!dragArea || !fileInput) return;

  dragArea.addEventListener("click", () => fileInput.click());

  dragArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragArea.classList.add("dragover");
  });

  dragArea.addEventListener("dragleave", () => {
    dragArea.classList.remove("dragover");
  });

  dragArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dragArea.classList.remove("dragover");
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handlePluginUpload(files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handlePluginUpload(fileInput.files[0]);
    }
  });
}

// Custom JS plugin parsing
function handlePluginUpload(file) {
  if (!file.name.endsWith(".js")) {
    window.Toast.danger("Invalid File Extension", "GURU core engines only support importing compiled JavaScript files (.js)");
    return;
  }

  window.AppLoader.show(`Parsing ${file.name} metadata...`);

  setTimeout(() => {
    const rawName = file.name.replace(".js", "");
    const installed = getInstalledPlugins();
    
    // Add custom file upload plugin
    installed.push({
      id: Date.now().toString(),
      name: rawName,
      desc: "Uploaded custom module. Manually imported extension handling user triggers.",
      category: "Utilities",
      version: "v1.0.0",
      author: "Local Host",
      active: true
    });

    localStorage.setItem("guru_installed_plugins", JSON.stringify(installed));
    renderInstalled();

    window.AppLoader.hide();
    window.Toast.success("Upload Succeeded", `Successfully hot-loaded local plugin file '${file.name}'.`);
  }, 1200);
}

function triggerUploadModal() {
  const fileInput = document.getElementById("plugin-file-input");
  if (fileInput) fileInput.click();
}

// Map callbacks
window.switchPluginTab = switchPluginTab;
window.togglePluginActive = togglePluginActive;
window.installMarketplacePlugin = installMarketplacePlugin;
window.updatePlugin = updatePlugin;
window.deletePlugin = deletePlugin;
window.triggerUploadModal = triggerUploadModal;

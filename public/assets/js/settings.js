/**
 * GURU-XD Bot Hosting Platform
 * Settings Page Specific Logic & State (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Load configured or default settings
  loadSystemSettings();
});

// Setup dynamic initial parameters
function loadSystemSettings() {
  const current = JSON.parse(localStorage.getItem("guru_system_settings")) || {
    lang: "en",
    tz: "utc",
    cap: 5,
    prefix: ".",
    multiPrefix: true,
    ownerNum: "5521998342212",
    remoteExec: true,
    autoReadStatus: true,
    autoTyping: false,
    alwaysOnline: true,
    autoReadMsg: false
  };

  // Populate form fields
  if (document.getElementById("setting-lang")) document.getElementById("setting-lang").value = current.lang;
  if (document.getElementById("setting-tz")) document.getElementById("setting-tz").value = current.tz;
  if (document.getElementById("setting-node-cap")) document.getElementById("setting-node-cap").value = current.cap;
  if (document.getElementById("setting-prefix-val")) document.getElementById("setting-prefix-val").value = current.prefix;
  if (document.getElementById("setting-multi-prefix")) document.getElementById("setting-multi-prefix").checked = current.multiPrefix;
  if (document.getElementById("setting-owner-num")) document.getElementById("setting-owner-num").value = current.ownerNum;
  if (document.getElementById("setting-eval-allowed")) document.getElementById("setting-eval-allowed").checked = current.remoteExec;
  
  if (document.getElementById("setting-auto-read-status")) document.getElementById("setting-auto-read-status").checked = current.autoReadStatus;
  if (document.getElementById("setting-auto-typing")) document.getElementById("setting-auto-typing").checked = current.autoTyping;
  if (document.getElementById("setting-always-online")) document.getElementById("setting-always-online").checked = current.alwaysOnline;
  if (document.getElementById("setting-auto-read-msg")) document.getElementById("setting-auto-read-msg").checked = current.autoReadMsg;

  // Save back just in case
  localStorage.setItem("guru_system_settings", JSON.stringify(current));
}

// Left side links page switching
function switchSettingsSection(sectionId, element) {
  // Hide all panes
  const panes = document.querySelectorAll(".settings-pane");
  panes.forEach(p => p.style.display = "none");

  // Show target pane
  const target = document.getElementById(`pane-${sectionId}`);
  if (target) target.style.display = "block";

  // Toggle active class on links
  const links = document.querySelectorAll(".settings-links-list li");
  links.forEach(l => l.classList.remove("active"));
  element.classList.add("active");
}

// Persist settings changes
function saveSettingsForm(paneType) {
  const settings = JSON.parse(localStorage.getItem("guru_system_settings")) || {};

  window.AppLoader.show(`Updating system variables...`);

  setTimeout(() => {
    if (paneType === "general") {
      settings.lang = document.getElementById("setting-lang").value;
      settings.tz = document.getElementById("setting-tz").value;
      settings.cap = parseInt(document.getElementById("setting-node-cap").value);
    } else if (paneType === "prefix") {
      settings.prefix = document.getElementById("setting-prefix-val").value.trim();
      settings.multiPrefix = document.getElementById("setting-multi-prefix").checked;
    } else if (paneType === "owner") {
      settings.ownerNum = document.getElementById("setting-owner-num").value.trim();
      settings.remoteExec = document.getElementById("setting-eval-allowed").checked;
    } else if (paneType === "automations") {
      settings.autoReadStatus = document.getElementById("setting-auto-read-status").checked;
      settings.autoTyping = document.getElementById("setting-auto-typing").checked;
      settings.alwaysOnline = document.getElementById("setting-always-online").checked;
      settings.autoReadMsg = document.getElementById("setting-auto-read-msg").checked;
    }

    localStorage.setItem("guru_system_settings", JSON.stringify(settings));
    window.AppLoader.hide();
    window.Toast.success("Settings Saved", `Successfully updated system configs for panel: ${paneType.toUpperCase()}`);
  }, 1000);
}

// Cache/Database cleaners
function purgeCacheFiles(type) {
  const isMedia = type === "media";
  
  window.ConfirmationDialog.show({
    title: isMedia ? "Empty Media cache?" : "Reset Subscriber Database?",
    message: isMedia 
      ? "This will delete all stored media caches, images, and voice notes. They will be downloaded afresh from servers on the next trigger."
      : "DANGER: This completely wipes the subscriber database. All statistics, message quotas, and blacklisted numbers will be purged permanently.",
    confirmText: isMedia ? "Purge Cache" : "Reset DB",
    cancelText: "Cancel",
    onConfirm: () => {
      window.AppLoader.show(`Clearing cache resources...`);
      setTimeout(() => {
        if (!isMedia) {
          // Clear subscribers database
          localStorage.removeItem("guru_users_list");
        }
        window.AppLoader.hide();
        window.Toast.success("Purge Succeeded", isMedia ? "Successfully purged 3.4 GB of temporary media caches." : "Subscriber database records cleared successfully.");
      }, 1000);
    }
  });
}

// Backup downloader
function exportBackupSettings() {
  window.AppLoader.show("Packaging platform configurations backup...");
  setTimeout(() => {
    window.AppLoader.hide();
    window.Toast.success("Export Complete", "GURU-SYSTEM-BACKUP.json backup file downloaded successfully.");
  }, 1200);
}

// Map callbacks
window.switchSettingsSection = switchSettingsSection;
window.saveSettingsForm = saveSettingsForm;
window.purgeCacheFiles = purgeCacheFiles;
window.exportBackupSettings = exportBackupSettings;

/**
 * GURU-XD Bot Hosting Platform
 * Files Explorer Specific Actions & State (Vanilla JS)
 */

let selectedFileType = "all";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  // Set navbar profile
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Mock Files Directory
  if (!localStorage.getItem("guru_files_explorer")) {
    const defaultFiles = [
      { id: "1", name: "whatsapp-session-hash.json", type: "document", size: "45 KB", date: "2026-07-16", icon: "fa-file-code", color: "var(--primary-color)" },
      { id: "2", name: "user-database.sqlite", type: "document", size: "14.2 MB", date: "2026-07-15", icon: "fa-database", color: "var(--warning-color)" },
      { id: "3", name: "guru-banner-promo.jpg", type: "image", size: "1.2 MB", date: "2026-07-12", thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80" },
      { id: "4", name: "welcome-voice-note.mp3", type: "audio", size: "3.4 MB", date: "2026-07-11", icon: "fa-file-audio", color: "var(--danger-color)" },
      { id: "5", name: "intro-tutorial-guide.mp4", type: "video", size: "48.5 MB", date: "2026-07-08", icon: "fa-file-video", color: "var(--success-color)" },
      { id: "6", name: "auto-config-template.js", type: "document", size: "12 KB", date: "2026-07-01", icon: "fa-file-code", color: "var(--primary-color)" },
      { id: "7", name: "avatar-default.png", type: "image", size: "450 KB", date: "2026-06-28", thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=300&q=80" },
      { id: "8", name: "backup-complete-0701.zip", type: "document", size: "142 MB", date: "2026-07-01", icon: "fa-file-zipper", color: "var(--warning-color)" }
    ];
    localStorage.setItem("guru_files_explorer", JSON.stringify(defaultFiles));
  }

  // Initial render
  renderFilesGrid();

  // Setup drag drop
  setupFilesDragDrop();
});

// Load directory
function getFilesList() {
  return JSON.parse(localStorage.getItem("guru_files_explorer")) || [];
}

// Render grid
function renderFilesGrid() {
  const container = document.getElementById("files-grid-container");
  if (!container) return;

  const files = getFilesList();
  const searchVal = (document.getElementById("file-search")?.value || "").toLowerCase();

  const filtered = files.filter(f => {
    const matchesCategory = selectedFileType === "all" || f.type === selectedFileType;
    const matchesSearch = f.name.toLowerCase().includes(searchVal);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
        This folder directory is empty.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(f => {
    // Generate Preview item
    let previewContent = "";
    if (f.thumbnail) {
      previewContent = `<img src="${f.thumbnail}" alt="${f.name}" class="file-preview-img">`;
    } else {
      let icon = f.icon || "fa-file";
      let color = f.color || "var(--text-secondary)";
      previewContent = `<i class="fa-solid ${icon}" style="color: ${color};"></i>`;
    }

    return `
      <div class="card file-item-card">
        <div>
          <div class="file-preview-thumbnail">
            ${previewContent}
          </div>
          <div class="file-meta-info">
            <span class="file-display-title" title="${f.name}">${f.name}</span>
            <span class="file-size-date">${f.size} &bull; ${f.date}</span>
          </div>
        </div>
        
        <div class="file-item-footer">
          <span class="badge ${f.type === "image" ? "badge-success" : f.type === "video" ? "badge-primary" : f.type === "audio" ? "badge-danger" : "badge-warning"}">${f.type.toUpperCase()}</span>
          <div class="file-item-actions">
            <button class="action-icon-btn" onclick="downloadFile('${f.name}')" title="Download File"><i class="fa-solid fa-cloud-arrow-down text-primary"></i></button>
            <button class="action-icon-btn" onclick="deleteFileRecord('${f.id}')" title="Delete File"><i class="fa-solid fa-trash-can text-danger"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Category filter
function filterFileType(type) {
  selectedFileType = type;

  const chips = document.querySelectorAll(".category-chip");
  chips.forEach(chip => chip.classList.remove("active"));

  const activeChip = document.getElementById(`fchip-${type}`);
  if (activeChip) activeChip.classList.add("active");

  renderFilesGrid();
}

// Download action
function downloadFile(name) {
  window.Toast.info("Preparing Download", `Compressing and requesting file token for '${name}'...`);
  setTimeout(() => {
    window.Toast.success("Download Initialized", `Local download stream for '${name}' started successfully.`);
  }, 1000);
}

// Delete action with Confirmation dialogue
function deleteFileRecord(id) {
  const files = getFilesList();
  const file = files.find(f => f.id === id);
  if (!file) return;

  window.ConfirmationDialog.show({
    title: `Purge ${file.name}?`,
    message: `This will permanently delete the file '${file.name}' from server directories, freeing up ${file.size} of storage space.`,
    confirmText: "Delete File",
    cancelText: "Cancel",
    onConfirm: () => {
      window.AppLoader.show(`Purging file sectors...`);
      setTimeout(() => {
        const updated = files.filter(f => f.id !== id);
        localStorage.setItem("guru_files_explorer", JSON.stringify(updated));
        renderFilesGrid();
        window.AppLoader.hide();
        window.Toast.success("File Deleted", `Successfully freed server registers occupied by ${file.name}.`);
      }, 800);
    }
  });
}

// Drag & Drop Setup
function setupFilesDragDrop() {
  const dragArea = document.getElementById("files-drag-area");
  const fileInput = document.getElementById("files-file-input");

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
      handleFilesUpload(files);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleFilesUpload(fileInput.files);
    }
  });
}

// Mock bulk upload handler
function handleFilesUpload(filesList) {
  window.AppLoader.show(`Buffering ${filesList.length} files...`);

  setTimeout(() => {
    const currentFiles = getFilesList();
    
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      
      // Categorize
      let type = "document";
      let icon = "fa-file-lines";
      let color = "var(--text-secondary)";

      if (file.type.startsWith("image/")) {
        type = "image";
        icon = "fa-file-image";
        color = "var(--success-color)";
      } else if (file.type.startsWith("video/")) {
        type = "video";
        icon = "fa-file-video";
        color = "var(--primary-color)";
      } else if (file.type.startsWith("audio/")) {
        type = "audio";
        icon = "fa-file-audio";
        color = "var(--danger-color)";
      }

      // Convert size to nice string
      let sizeStr = (file.size / (1024 * 1024)).toFixed(1);
      if (parseFloat(sizeStr) > 0) {
        sizeStr = sizeStr + " MB";
      } else {
        sizeStr = (file.size / 1024).toFixed(0) + " KB";
      }

      const fileObj = {
        id: (Date.now() + i).toString(),
        name: file.name,
        type: type,
        size: sizeStr,
        date: new Date().toISOString().split("T")[0],
        icon: icon,
        color: color
      };

      currentFiles.push(fileObj);
    }

    localStorage.setItem("guru_files_explorer", JSON.stringify(currentFiles));
    renderFilesGrid();

    window.AppLoader.hide();
    window.Toast.success("Files Imported", `Successfully synchronized ${filesList.length} files into GURU directories.`);
  }, 1500);
}

function triggerFileUpload() {
  const fileInput = document.getElementById("files-file-input");
  if (fileInput) fileInput.click();
}

// Map callbacks
window.filterFileType = filterFileType;
window.downloadFile = downloadFile;
window.deleteFileRecord = deleteFileRecord;
window.triggerFileUpload = triggerFileUpload;

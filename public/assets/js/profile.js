/**
 * GURU-XD Bot Hosting Platform
 * Profile Actions & States (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  // Set up profile details
  const currentUsername = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  const currentEmail = localStorage.getItem("guru_email") || "admin@guru-xd.host";

  if (document.getElementById("profile-username")) document.getElementById("profile-username").value = currentUsername;
  if (document.getElementById("profile-email")) document.getElementById("profile-email").value = currentEmail;
  if (document.getElementById("display-profile-username")) document.getElementById("display-profile-username").innerText = currentUsername;

  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) profileNameEl.innerText = currentUsername;

  // Prefill avatar if saved
  const savedAvatar = localStorage.getItem("guru_profile_avatar");
  if (savedAvatar && document.getElementById("avatar-preview-img")) {
    document.getElementById("avatar-preview-img").src = savedAvatar;
  }

  // Load API Keys
  if (!localStorage.getItem("guru_api_keys_list")) {
    const defaultApiKeys = [
      { id: "1", label: "GEMINI_API_KEY", key: "AIzaSyAs78Hfd9Gsd613Khv8Djs90Asf8", visible: false },
      { id: "2", label: "OPENAI_API_KEY", key: "sk-proj-781HdaGfs712Jas68D79Gsd8", visible: false }
    ];
    localStorage.setItem("guru_api_keys_list", JSON.stringify(defaultApiKeys));
  }

  renderApiKeys();

  // Attach submit listeners
  const infoForm = document.getElementById("profile-info-form");
  if (infoForm) {
    infoForm.addEventListener("submit", handleProfileInfoSave);
  }

  const pwdForm = document.getElementById("profile-password-form");
  if (pwdForm) {
    pwdForm.addEventListener("submit", handlePasswordUpdate);
  }

  // Set up Add API key modal
  const apiModal = new window.UIModal("add-api-modal");
  const apiForm = document.getElementById("add-api-form");
  if (apiForm) {
    apiForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveNewApiKey(apiModal);
    });
  }
});

// Load keys list
function getApiKeys() {
  return JSON.parse(localStorage.getItem("guru_api_keys_list")) || [];
}

// Render credentials cards
function renderApiKeys() {
  const container = document.getElementById("api-keys-container");
  if (!container) return;

  const keys = getApiKeys();

  if (keys.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-secondary); padding:20px; font-size:12.5px;">No custom API keys registered yet.</div>`;
    return;
  }

  container.innerHTML = keys.map(k => {
    // Mask key logic
    let displayVal = "••••••••••••••••••••••••••••••••";
    if (k.visible) {
      displayVal = k.key;
    }

    return `
      <div class="api-key-item">
        <div class="api-key-meta">
          <span class="api-key-label">${k.label}</span>
          <span class="api-key-masked-val" id="api-val-${k.id}">${displayVal}</span>
        </div>
        
        <div class="api-key-actions">
          <button class="action-icon-btn" onclick="toggleKeyVisibility('${k.id}')" title="Toggle visibility">
            <i class="fa-solid ${k.visible ? 'fa-eye-slash text-warning' : 'fa-eye text-primary'}"></i>
          </button>
          <button class="action-icon-btn" onclick="deleteApiKey('${k.id}')" title="Delete API Secret">
            <i class="fa-solid fa-trash-can text-danger"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Toggle Visibility
function toggleKeyVisibility(id) {
  const keys = getApiKeys();
  const idx = keys.findIndex(k => k.id === id);
  if (idx === -1) return;

  keys[idx].visible = !keys[idx].visible;
  localStorage.setItem("guru_api_keys_list", JSON.stringify(keys));
  renderApiKeys();
}

// Delete API Key with warning dialog
function deleteApiKey(id) {
  const keys = getApiKeys();
  const keyObj = keys.find(k => k.id === id);
  if (!keyObj) return;

  window.ConfirmationDialog.show({
    title: `Purge ${keyObj.label}?`,
    message: `Active bot plugins relying on standard variable '${keyObj.label}' to trigger chats queries will fail immediately.`,
    confirmText: "Delete Secret",
    cancelText: "Cancel",
    onConfirm: () => {
      const updated = keys.filter(k => k.id !== id);
      localStorage.setItem("guru_api_keys_list", JSON.stringify(updated));
      renderApiKeys();
      window.Toast.danger("Credential Purged", `Secret key '${keyObj.label}' deleted.`);
    }
  });
}

// Modal actions
function addNewApiKey() {
  const modal = new window.UIModal("add-api-modal");
  modal.show();
}

// Save secret
function saveNewApiKey(modalInstance) {
  const label = document.getElementById("api-label").value.trim().toUpperCase().replace(/ /g, "_");
  const value = document.getElementById("api-secret-val").value.trim();

  const keys = getApiKeys();
  keys.push({
    id: Date.now().toString(),
    label,
    key: value,
    visible: false
  });

  localStorage.setItem("guru_api_keys_list", JSON.stringify(keys));
  renderApiKeys();

  modalInstance.hide();
  window.Toast.success("Credential Saved", `Variable '${label}' successfully bound into local core environments.`);
  
  // Clear inputs
  document.getElementById("api-label").value = "";
  document.getElementById("api-secret-val").value = "";
}

// Save profile text fields
function handleProfileInfoSave(e) {
  e.preventDefault();

  const newUsername = document.getElementById("profile-username").value.trim();
  const newEmail = document.getElementById("profile-email").value.trim();

  window.AppLoader.show("Updating operator data registers...");

  setTimeout(() => {
    localStorage.setItem("guru_username", newUsername);
    localStorage.setItem("guru_email", newEmail);

    // Refresh display
    if (document.getElementById("display-profile-username")) {
      document.getElementById("display-profile-username").innerText = newUsername;
    }

    const profileNameEl = document.querySelector(".profile-name");
    if (profileNameEl) profileNameEl.innerText = newUsername;

    window.AppLoader.hide();
    window.Toast.success("Profile Updated", "Operator database records updated successfully.");
  }, 1000);
}

// Modify password hashes
function handlePasswordUpdate(e) {
  e.preventDefault();

  const oldPwd = document.getElementById("profile-old-pwd").value;
  const newPwd = document.getElementById("profile-new-pwd").value;
  const confirmPwd = document.getElementById("profile-confirm-pwd").value;

  const currentSavedPwd = localStorage.getItem("guru_password") || "guru123";

  if (oldPwd !== currentSavedPwd) {
    window.Toast.danger("Authentication Failed", "The current password inputted does not match our databases.");
    return;
  }

  if (newPwd.length < 6) {
    window.Toast.warning("Weak Password", "Please construct a password containing at least 6 alphanumeric characters.");
    return;
  }

  if (newPwd !== confirmPwd) {
    window.Toast.danger("Mismatched Passwords", "The password confirmation input field does not match.");
    return;
  }

  window.AppLoader.show("Hashing password matrices...");

  setTimeout(() => {
    localStorage.setItem("guru_password", newPwd);
    
    // Clear form inputs
    document.getElementById("profile-old-pwd").value = "";
    document.getElementById("profile-new-pwd").value = "";
    document.getElementById("profile-confirm-pwd").value = "";

    window.AppLoader.hide();
    window.Toast.success("Password Updated", "Security handshake password updated successfully.");
  }, 1200);
}

// Click camera edit button
function triggerAvatarUpload() {
  const input = document.getElementById("profile-avatar-input");
  if (input) input.click();
}

// Render temporary base64 image avatar preview
function previewAvatarImage(inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    
    if (document.getElementById("avatar-preview-img")) {
      document.getElementById("avatar-preview-img").src = base64;
    }

    localStorage.setItem("guru_profile_avatar", base64);
    window.Toast.success("Avatar Updated", "New operator profile photo uploaded successfully.");
  };
  reader.readAsDataURL(file);
}

// Map callbacks
window.toggleKeyVisibility = toggleKeyVisibility;
window.deleteApiKey = deleteApiKey;
window.addNewApiKey = addNewApiKey;
window.triggerAvatarUpload = triggerAvatarUpload;
window.previewAvatarImage = previewAvatarImage;

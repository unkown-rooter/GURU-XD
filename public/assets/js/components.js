/**
 * GURU-XD Bot Hosting Platform
 * Reusable ES6 UI Components and Utilities
 */

// Loader manager
class AppLoader {
  static show(text = "Loading...") {
    let loader = document.getElementById("app-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "app-loader";
      loader.className = "loader-wrapper";
      loader.innerHTML = `
        <div class="spinner"></div>
        <div class="loader-text" id="app-loader-text">${text}</div>
      `;
      document.body.appendChild(loader);
    } else {
      document.getElementById("app-loader-text").innerText = text;
      loader.style.opacity = "1";
      loader.style.visibility = "visible";
    }
  }

  static hide() {
    const loader = document.getElementById("app-loader");
    if (loader) {
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
      setTimeout(() => {
        if (loader.style.opacity === "0") {
          loader.remove();
        }
      }, 400);
    }
  }
}

// Toast Notifications System
class Toast {
  static container() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  static show(title, message, type = "primary", duration = 4000) {
    const container = this.container();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "fa-info-circle";
    if (type === "success") icon = "fa-circle-check";
    if (type === "warning") icon = "fa-triangle-exclamation";
    if (type === "danger") icon = "fa-circle-exclamation";

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
      toast.style.transform = "translateX(120%)";
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  static success(title, message) { this.show(title, message, "success"); }
  static danger(title, message) { this.show(title, message, "danger"); }
  static warning(title, message) { this.show(title, message, "warning"); }
  static info(title, message) { this.show(title, message, "primary"); }
}

// Reusable Modal Handler
class UIModal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    if (this.modal) {
      // Setup close button listeners if found
      const closeBtns = this.modal.querySelectorAll("[data-close-modal], .modal-close");
      closeBtns.forEach(btn => {
        btn.addEventListener("click", () => this.hide());
      });
      // Close on clicking the backdrop itself
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });
    }
  }

  show() {
    if (this.modal) {
      this.modal.classList.add("show");
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove("show");
    }
  }
}

// Reusable Confirmation Dialog
class ConfirmationDialog {
  static show({ title = "Are you sure?", message = "This action cannot be undone.", confirmText = "Confirm", cancelText = "Cancel", onConfirm }) {
    let dialog = document.getElementById("confirmation-dialog");
    if (dialog) dialog.remove();

    dialog = document.createElement("div");
    dialog.id = "confirmation-dialog";
    dialog.className = "modal-backdrop show";
    dialog.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <span class="modal-title text-danger">${title}</span>
          <button class="modal-close" id="conf-dialog-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.5;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="conf-dialog-cancel">${cancelText}</button>
          <button class="btn btn-danger btn-sm" id="conf-dialog-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const closeBtn = dialog.querySelector("#conf-dialog-close");
    const cancelBtn = dialog.querySelector("#conf-dialog-cancel");
    const confirmBtn = dialog.querySelector("#conf-dialog-confirm");

    const dismiss = () => {
      dialog.classList.remove("show");
      setTimeout(() => dialog.remove(), 200);
    };

    closeBtn.addEventListener("click", dismiss);
    cancelBtn.addEventListener("click", dismiss);
    confirmBtn.addEventListener("click", () => {
      if (typeof onConfirm === "function") {
        onConfirm();
      }
      dismiss();
    });
  }
}

// Map helpers to global scope
window.AppLoader = AppLoader;
window.Toast = Toast;
window.UIModal = UIModal;
window.ConfirmationDialog = ConfirmationDialog;

// Hide initial loader if any is present on load
window.addEventListener("load", () => {
  setTimeout(() => AppLoader.hide(), 300);
});

/**
 * GURU-XD Bot Hosting Platform
 * Users Database Actions & State (Vanilla JS)
 */

let currentPage = 1;
const itemsPerPage = 5;

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("guru_logged_in") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl) {
    profileNameEl.innerText = localStorage.getItem("guru_username") || "GURU-XD ADMIN";
  }

  // Set up mock users
  if (!localStorage.getItem("guru_users_list")) {
    const defaultUsers = [
      { id: "1", name: "Alfonso Gomez", phone: "+55 (21) 99834-2212", status: "admin", groups: 12, messages: 14820, lastSeen: "Active now" },
      { id: "2", name: "Sarah Connor", phone: "+1 (201) 555-0184", status: "member", groups: 4, messages: 4520, lastSeen: "12 mins ago" },
      { id: "3", name: "Kenji Sato", phone: "+81 (90) 1234-5678", status: "member", groups: 8, messages: 9410, lastSeen: "1 hour ago" },
      { id: "4", name: "Ivan Petrov", phone: "+7 (901) 234-5678", status: "blocked", groups: 0, messages: 280, lastSeen: "3 days ago" },
      { id: "5", name: "Amara Diallo", phone: "+221 (77) 123-4567", status: "member", groups: 14, messages: 18450, lastSeen: "Active now" },
      { id: "6", name: "Liam O'Connor", phone: "+353 (87) 123-4567", status: "member", groups: 3, messages: 1240, lastSeen: "4 hours ago" },
      { id: "7", name: "Carlos Santana", phone: "+52 (55) 1234-5678", status: "admin", groups: 22, messages: 32480, lastSeen: "Active now" },
      { id: "8", name: "Chen Wei", phone: "+86 (10) 1234-5678", status: "blocked", groups: 0, messages: 4210, lastSeen: "2 weeks ago" }
    ];
    localStorage.setItem("guru_users_list", JSON.stringify(defaultUsers));
  }

  renderUsersTable();
});

// Retrieve
function getUsers() {
  return JSON.parse(localStorage.getItem("guru_users_list")) || [];
}

// Render dynamic table
function renderUsersTable() {
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;

  const users = getUsers();
  const searchVal = (document.getElementById("user-search")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("user-status-filter")?.value || "all";

  // Filter
  const filtered = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchVal) || user.phone.includes(searchVal);
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Update footer info
  const infoText = document.getElementById("pagination-info-text");
  if (infoText) {
    infoText.innerText = `Page ${currentPage} of ${totalPages} (${filtered.length} total)`;
  }

  // Toggle prev/next buttons
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;

  if (paginated.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="fa-solid fa-users-slash" style="font-size: 32px; display: block; margin-bottom: 12px; opacity: 0.5;"></i>
          No subscribers found matching query filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = paginated.map(user => {
    // Determine initials
    const initials = user.name.split(" ").map(n => n[0]).join("").substring(0, 2);
    
    // Status badges
    let statusClass = "badge-member";
    let statusLabel = "Member";
    if (user.status === "admin") { statusClass = "badge-admin"; statusLabel = "Administrator"; }
    else if (user.status === "blocked") { statusClass = "badge-blocked"; statusLabel = "Blocked"; }

    // Toggle actions based on status
    let roleActionBtn = "";
    if (user.status === "blocked") {
      roleActionBtn = `<button class="action-icon-btn start-btn" onclick="toggleUserStatus('${user.id}', 'unblock')" title="Unblock user"><i class="fa-solid fa-user-check"></i></button>`;
    } else {
      const isAdmin = user.status === "admin";
      roleActionBtn = `
        <button class="action-icon-btn edit-btn" onclick="toggleUserStatus('${user.id}', '${isAdmin ? 'demote' : 'promote'}')" title="${isAdmin ? 'Demote member' : 'Promote to Admin'}">
          <i class="fa-solid ${isAdmin ? 'fa-user-minus' : 'fa-user-shield'}"></i>
        </button>
        <button class="action-icon-btn delete-btn" onclick="toggleUserStatus('${user.id}', 'block')" title="Block user"><i class="fa-solid fa-user-slash"></i></button>
      `;
    }

    return `
      <tr>
        <td>
          <div class="user-cell-wrapper">
            <div class="user-avatar-circle">${initials}</div>
            <div class="user-cell-meta">
              <span class="user-cell-name">${user.name}</span>
              <span class="user-cell-sub">ID: usr_0${user.id}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="user-phone-code">${user.phone}</span>
        </td>
        <td>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </td>
        <td>
          <span class="user-groups-badge">
            <i class="fa-solid fa-users"></i> ${user.groups} groups
          </span>
        </td>
        <td class="user-msg-counter">
          ${user.messages.toLocaleString()}
        </td>
        <td>
          <div class="user-last-seen-status">
            <span class="user-last-seen-time">${user.lastSeen}</span>
            ${user.lastSeen === "Active now" ? `<span class="status-indicator online" style="width:6px; height:6px;"></span>` : ""}
          </div>
        </td>
        <td>
          <div class="row-actions-wrapper">
            ${roleActionBtn}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Change page
function changePage(direction) {
  currentPage += direction;
  renderUsersTable();
}

// Block, Promote, Demote user state actions with full reactivity
function toggleUserStatus(id, action) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;

  const user = users[idx];

  if (action === "block") {
    window.ConfirmationDialog.show({
      title: `Block ${user.name}?`,
      message: `Blocked subscribers will be immediately kicked from bot databases, banned from group actions, and ignored by active message event loops.`,
      confirmText: "Block Client",
      cancelText: "Cancel",
      onConfirm: () => {
        window.AppLoader.show(`Suspending client authorizations...`);
        setTimeout(() => {
          user.status = "blocked";
          user.groups = 0;
          localStorage.setItem("guru_users_list", JSON.stringify(users));
          renderUsersTable();
          window.AppLoader.hide();
          window.Toast.danger("Client Suspended", `${user.name} has been blacklisted.`);
        }, 800);
      }
    });
  } else if (action === "unblock") {
    user.status = "member";
    localStorage.setItem("guru_users_list", JSON.stringify(users));
    renderUsersTable();
    window.Toast.success("Authorization Restored", `${user.name} was successfully removed from blocklists.`);
  } else if (action === "promote") {
    user.status = "admin";
    localStorage.setItem("guru_users_list", JSON.stringify(users));
    renderUsersTable();
    window.Toast.success("Promotion Succeeded", `${user.name} promoted to System Administrator.`);
  } else if (action === "demote") {
    user.status = "member";
    localStorage.setItem("guru_users_list", JSON.stringify(users));
    renderUsersTable();
    window.Toast.warning("Access Level Demoted", `${user.name} access privilege returned to Member.`);
  }
}

// CSV exporter
function exportUsersCsv() {
  window.AppLoader.show("Generating subscriber CSV data...");
  setTimeout(() => {
    window.AppLoader.hide();
    window.Toast.success("Export Successful", "Contacts dataset GURU-CONTACTS-EXPORT.csv downloaded.");
  }, 1200);
}

// Map callbacks
window.changePage = changePage;
window.toggleUserStatus = toggleUserStatus;
window.exportUsersCsv = exportUsersCsv;

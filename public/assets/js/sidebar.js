/**
 * GURU-XD Bot Hosting Platform
 * Sidebar Component (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
});

function renderSidebar() {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  // Determine active page
  const currentPath = window.location.pathname;
  const activePage = currentPath.substring(currentPath.lastIndexOf("/") + 1);

  const menuItems = [
    { name: "Dashboard", icon: "fa-chart-pie", href: "dashboard.html" },
    { name: "Bots", icon: "fa-robot", href: "bots.html" },
    { name: "Sessions", icon: "fa-key", href: "sessions.html" },
    { name: "Commands", icon: "fa-terminal", href: "commands.html" },
    { name: "Plugins", icon: "fa-plug", href: "plugins.html" },
    { name: "Files", icon: "fa-folder-open", href: "files.html" },
    { name: "Users", icon: "fa-users", href: "users.html" },
    { name: "Analytics", icon: "fa-chart-line", href: "analytics.html" },
    { name: "Logs", icon: "fa-file-lines", href: "logs.html" },
    { name: "Settings", icon: "fa-gears", href: "settings.html" },
    { name: "Profile", icon: "fa-user", href: "profile.html" },
  ];

  const sidebarHTML = `
    <div class="sidebar" id="sidebar-menu">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <i class="fa-solid fa-bolt text-blue-500"></i>
        </div>
        <span class="brand-text">GURU<span class="text-primary">-XD</span></span>
        <button class="sidebar-close-btn" id="sidebar-close-btn">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      <div class="sidebar-menu-wrapper">
        <ul class="sidebar-menu-list">
          ${menuItems
            .map((item) => {
              const isActive = activePage === item.href ? "active" : "";
              return `
              <li class="sidebar-menu-item">
                <a href="${item.href}" class="sidebar-menu-link ${isActive}" id="sidebar-link-${item.name.toLowerCase()}">
                  <i class="fa-solid fa-${item.icon} menu-icon"></i>
                  <span class="menu-label">${item.name}</span>
                </a>
              </li>
            `;
            })
            .join("")}
        </ul>
        
        <div class="sidebar-divider"></div>
        
        <ul class="sidebar-menu-list logout-list">
          <li class="sidebar-menu-item">
            <a href="login.html" class="sidebar-menu-link logout-link-btn" id="sidebar-link-logout">
              <i class="fa-solid fa-right-from-bracket menu-icon text-danger"></i>
              <span class="menu-label">Logout</span>
            </a>
          </li>
        </ul>
      </div>

      <div class="sidebar-footer">
        <div class="footer-status">
          <span class="status-indicator online"></span>
          <span class="footer-status-text">Server online</span>
        </div>
        <div class="footer-version">v2.4.0</div>
      </div>
    </div>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  `;

  container.innerHTML = sidebarHTML;

  // Add Toggle event listeners
  const closeBtn = document.getElementById("sidebar-close-btn");
  const backdrop = document.getElementById("sidebar-backdrop");
  
  if (closeBtn) {
    closeBtn.addEventListener("click", toggleSidebar);
  }
  if (backdrop) {
    backdrop.addEventListener("click", toggleSidebar);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar && backdrop) {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show");
  }
}

// Export for other scripts if needed
window.toggleSidebar = toggleSidebar;

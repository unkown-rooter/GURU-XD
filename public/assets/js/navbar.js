/**
 * GURU-XD Bot Hosting Platform
 * Navbar Component (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
});

function renderNavbar() {
  const container = document.getElementById("navbar-container");
  if (!container) return;

  const navbarHTML = `
    <header class="navbar">
      <div class="navbar-left">
        <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" aria-label="Toggle Sidebar">
          <i class="fa-solid fa-bars"></i>
        </button>
        
        <div class="navbar-search">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" placeholder="Search bots, commands, logs..." id="navbar-search-input">
        </div>
      </div>
      
      <div class="navbar-right">
        <div class="status-badge-wrapper">
          <span class="status-badge">
            <span class="pulse-indicator"></span>
            GURU Core Live
          </span>
        </div>

        <button class="nav-icon-btn" id="theme-toggle-btn" title="Toggle Theme">
          <i class="fa-solid fa-moon"></i>
        </button>
        
        <div class="nav-dropdown-wrapper notification-wrapper">
          <button class="nav-icon-btn" id="notification-btn" title="Notifications">
            <i class="fa-solid fa-bell"></i>
            <span class="notification-count">3</span>
          </button>
          
          <div class="dropdown-menu notification-dropdown" id="notification-dropdown">
            <div class="dropdown-header">
              <span>Notifications</span>
              <button class="clear-all-btn">Mark read</button>
            </div>
            <div class="dropdown-list">
              <a href="#" class="dropdown-item unread">
                <div class="item-icon bg-success">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div class="item-content">
                  <p class="item-text"><strong>GURU-BOT-01</strong> started successfully.</p>
                  <span class="item-time">2 mins ago</span>
                </div>
              </a>
              <a href="#" class="dropdown-item unread">
                <div class="item-icon bg-warning">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div class="item-content">
                  <p class="item-text">CPU load exceeded 85% on Server Instance.</p>
                  <span class="item-time">15 mins ago</span>
                </div>
              </a>
              <a href="#" class="dropdown-item">
                <div class="item-icon bg-danger">
                  <i class="fa-solid fa-plug-circle-xmark"></i>
                </div>
                <div class="item-content">
                  <p class="item-text">Session <strong>Multi-Device 04</strong> disconnected.</p>
                  <span class="item-time">1 hour ago</span>
                </div>
              </a>
            </div>
            <div class="dropdown-footer">
              <a href="logs.html">View all activity logs</a>
            </div>
          </div>
        </div>

        <div class="nav-dropdown-wrapper profile-dropdown-wrapper">
          <button class="profile-trigger-btn" id="profile-trigger-btn">
            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80" alt="Profile" class="profile-img">
            <div class="profile-info">
              <span class="profile-name">GURU-XD ADMIN</span>
              <span class="profile-role">Owner</span>
            </div>
            <i class="fa-solid fa-chevron-down profile-arrow"></i>
          </button>
          
          <div class="dropdown-menu profile-dropdown" id="profile-dropdown">
            <a href="profile.html" class="dropdown-link">
              <i class="fa-solid fa-user"></i>
              My Profile
            </a>
            <a href="settings.html" class="dropdown-link">
              <i class="fa-solid fa-gears"></i>
              System Settings
            </a>
            <div class="dropdown-divider"></div>
            <a href="login.html" class="dropdown-link text-danger">
              <i class="fa-solid fa-right-from-bracket"></i>
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </header>
  `;

  container.innerHTML = navbarHTML;

  // Hamburger Toggle logic
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar-menu");
      const backdrop = document.getElementById("sidebar-backdrop");
      if (sidebar && backdrop) {
        sidebar.classList.add("open");
        backdrop.classList.add("show");
      }
    });
  }

  // Handle Notifications Dropdown toggle
  const notificationBtn = document.getElementById("notification-btn");
  const notificationDropdown = document.getElementById("notification-dropdown");
  if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle("show");
      profileDropdown.classList.remove("show");
    });
  }

  // Handle Profile Dropdown toggle
  const profileTrigger = document.getElementById("profile-trigger-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  if (profileTrigger && profileDropdown) {
    profileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
      notificationDropdown.classList.remove("show");
    });
  }

  // Theme Toggle logic (Saves setting to LocalStorage for persistence across page navigations!)
  const themeToggle = document.getElementById("theme-toggle-btn");
  if (themeToggle) {
    // Set initial icon based on state
    const currentTheme = localStorage.getItem("theme") || "dark";
    if (currentTheme === "light") {
      document.body.classList.add("light-theme");
      themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    }

    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      themeToggle.innerHTML = isLight ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
    });
  }

  // Close dropdowns on click outside
  document.addEventListener("click", () => {
    if (notificationDropdown) notificationDropdown.classList.remove("show");
    if (profileDropdown) profileDropdown.classList.remove("show");
  });
}

/**
 * GURU-XD Bot Hosting Platform
 * Login Functionality (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const passwordToggle = document.getElementById("password-toggle");
  const passwordInput = document.getElementById("password");

  // Toggle Password Visibility
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      
      const icon = passwordToggle.querySelector("i");
      if (icon) {
        icon.className = type === "password" ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
      }
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const username = document.getElementById("username").value.trim();
      const password = passwordInput.value;

      // Disable button
      const submitBtn = document.getElementById("submit-btn");
      if (submitBtn) submitBtn.disabled = true;

      // Show loader
      window.AppLoader.show("Verifying GURU credentials...");

      setTimeout(() => {
        if (username === "admin" && password === "admin123") {
          window.AppLoader.show("Securing session token...");
          
          setTimeout(() => {
            window.AppLoader.hide();
            // Store credentials to mock actual authorization status
            localStorage.setItem("guru_logged_in", "true");
            localStorage.setItem("guru_username", "GURU-XD ADMIN");
            
            // Show toast and redirect
            window.Toast.success("Authorization Succeeded", "Redirecting to host dashboard...");
            
            setTimeout(() => {
              window.location.href = "dashboard.html";
            }, 1000);
          }, 800);
        } else {
          window.AppLoader.hide();
          if (submitBtn) submitBtn.disabled = false;
          window.Toast.danger("Access Denied", "Invalid username or password. Please use the credentials provided in the info box.");
        }
      }, 1200);
    });
  }
});

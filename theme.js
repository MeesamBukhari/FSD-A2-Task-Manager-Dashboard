const THEME_KEY = "taskManager_theme";

// Get theme toggle button and icon
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

console.log("Theme script loaded");
console.log("Toggle button found:", !!themeToggle);
console.log("Icon found:", !!themeIcon);

// Load saved theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    console.log("Loaded theme from storage:", savedTheme);
    return savedTheme === "dark";
}

// Apply theme to body and update icon
function applyTheme(isDark) {
    console.log("Applying theme:", isDark ? "dark" : "light");
    
    if (isDark) {
        document.body.classList.add("dark");
        if (themeIcon) {
            themeIcon.className = "bi bi-sun-fill";
        }
    } else {
        document.body.classList.remove("dark");
        if (themeIcon) {
            themeIcon.className = "bi bi-moon-fill";
        }
    }
}

// Toggle between dark and light theme
function toggleTheme() {
    const isDark = document.body.classList.contains("dark");
    const newTheme = !isDark;
    
    console.log("Toggling theme from", isDark ? "dark" : "light", "to", newTheme ? "dark" : "light");
    
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme ? "dark" : "light");
}

// Initialize theme system
function initTheme() {
    console.log("Initializing theme system...");
    
    if (!themeToggle) {
        console.error("Theme toggle button not found!");
        return;
    }
    
    if (!themeIcon) {
        console.error("Theme icon not found!");
        return;
    }
    
    // Load and apply saved theme
    const isDark = loadTheme();
    applyTheme(isDark);
    
    // Add click event listener to toggle button
    themeToggle.addEventListener("click", toggleTheme);
    
    console.log("Theme system initialized successfully!");
}

// Wait for DOM to be fully loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
} else {
    // DOM already loaded
    initTheme();
}
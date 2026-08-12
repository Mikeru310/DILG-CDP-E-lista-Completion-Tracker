// Simple demo "accounts database" using localStorage
// users: [{ username, password, role }]
const USERS_KEY = "dilg_users";
const SESSION_KEY = "dilg_session";

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function goByRole(role) {
  if (role === "FP") {
    window.location.href = "progress.html";
  } else if (role === "MLGOO") {
    window.location.href = "mlgoo_dashboard.html";
  } else {
    window.location.href = "login.html";
  }
}

// Elements
const showSignupBtn = document.getElementById("showSignupBtn");
const signupForm = document.getElementById("signupForm");
const signupMsg = document.getElementById("signupMsg");

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");

// Toggle signup form visibility
showSignupBtn.addEventListener("click", () => {
  signupForm.classList.toggle("hidden");
  signupMsg.textContent = "";
});

// SIGN UP
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  signupMsg.textContent = "";

  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("signupRole").value;

  if (username.length < 3) {
    signupMsg.textContent = "Username must be at least 3 characters.";
    return;
  }
  if (password.length < 4) {
    signupMsg.textContent = "Password must be at least 4 characters.";
    return;
  }
  if (!role) {
    signupMsg.textContent = "Please select a role.";
    return;
  }

  const users = loadUsers();
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    signupMsg.textContent = "That username is already taken.";
    return;
  }

  users.push({ username, password, role });
  saveUsers(users);

  // Auto login
  setSession({ username, role });

  // Redirect based on role
  goByRole(role);
});

// LOGIN
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginMsg.textContent = "";

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  const users = loadUsers();
  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!found) {
    loginMsg.textContent = "Account not found. Click Sign up to create one.";
    return;
  }
  if (found.password !== password) {
    loginMsg.textContent = "Incorrect password.";
    return;
  }

  setSession({ username: found.username, role: found.role });
  goByRole(found.role);
});

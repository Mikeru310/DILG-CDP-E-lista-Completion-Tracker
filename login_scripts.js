document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.getElementById("loginBox");
  const registerBox = document.getElementById("registerBox");

  const goRegister = document.getElementById("goRegister");
  const goLogin = document.getElementById("goLogin");

  const loginMsg = document.getElementById("loginMsg");
  const registerMsg = document.getElementById("registerMsg");

  function clearMessages() {
    if (loginMsg) {
      loginMsg.textContent = "";
      loginMsg.style.color = "";
    }
    if (registerMsg) {
      registerMsg.textContent = "";
      registerMsg.style.color = "";
      registerMsg.style.marginTop = "";
      registerMsg.style.marginBottom = "";
    }
  }

  function showRegister() {
    clearMessages();
    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");
  }

  function showLogin() {
    clearMessages();
    registerBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
  }

  // Buttons (with safety checks)
  if (goRegister) goRegister.addEventListener("click", showRegister);
  if (goLogin) goLogin.addEventListener("click", showLogin);

  // URL params
  const params = new URLSearchParams(window.location.search);

  // ✅ Priority: register_error should always show register form
  if (params.has("register_error")) {
    showRegister();
    if (registerMsg) {
      registerMsg.textContent = params.get("register_error");
      registerMsg.style.color = "red";
      registerMsg.style.marginTop = "8px";
      registerMsg.style.marginBottom = "12px";
    }
    return; // stop here so it won't also show success message
  }

  // ✅ Registration success → show on login
  if (params.get("registered") === "1") {
    showLogin();
    if (loginMsg) {
      loginMsg.textContent = "Registration successful. Please log in.";
      loginMsg.style.color = "green";
    }
  }
});

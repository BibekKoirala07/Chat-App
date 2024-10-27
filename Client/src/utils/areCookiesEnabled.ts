const areCookiesEnabled = () => {
  document.cookie = "chat-app-token=1; SameSite=Strict"; // Set a test cookie
  const cookiesEnabled = document.cookie.includes("chat-app-token");
  document.cookie =
    "chat-app-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Clean up
  return cookiesEnabled;
};

export default areCookiesEnabled;

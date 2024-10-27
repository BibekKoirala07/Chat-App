function areCookiesEnabled() {
  document.cookie = "testcookie=1; SameSite=Lax";

  if (document.cookie.indexOf("testcookie=1") !== -1) {
    document.cookie = "testcookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return true;
  } else {
    return false;
  }
}
export default areCookiesEnabled;

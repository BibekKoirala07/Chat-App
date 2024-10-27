import { AppDispatch } from "../store/store"; // Adjust the import based on your file structure
import { logout } from "../store/slices/userSlice"; // Import your logout action
import areCookiesEnabled from "./areCookiesEnabled";

const FetchApiWrapper = async (
  url: URL,
  options: RequestInit = {},
  dispatch: AppDispatch
) => {
  let token;
  if (!areCookiesEnabled) {
    token = await localStorage.getItem("chat-app-token");
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();

  console.log("data in fetchApiWrapper", data);

  if (!response.ok) {
    if (
      data.message == "No token provided" ||
      data.message == "Token verification failed"
    ) {
      dispatch(logout());
    }
  }

  return { response, data };
};

export default FetchApiWrapper;

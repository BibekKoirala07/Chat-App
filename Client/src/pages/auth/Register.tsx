import React, { useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import EachInput from "@/components/auth/EachInput";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "@/store/store";
import { useDispatch } from "react-redux";
import areCookiesEnabled from "@/utils/areCookiesEnabled";

const Register = () => {
  const naviagte = useNavigate();
  const dispatch = useDispatch();

  const url =
    import.meta.env.VITE_NODE_ENV == "production"
      ? import.meta.env.VITE_PROD_BACKEND_URL
      : import.meta.env.VITE_DEV_BACKEND_URL;

  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>("");
  const [success, setSuccess] = useState<string | null>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // dispatch(loginStart());

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!username) {
      setError("Username is required");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    if (username.length > 40) {
      setError("Username cannot be longer than 40 characters");
      return;
    }

    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      // const response = await authService.register({
      //   username,
      //   email,
      //   password,
      // });
      const response = await fetch(`${url}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Registration failed");
        setIsLoading(false);
      } else {
        setSuccess(data.message);
        if (data.data) {
          dispatch(loginSuccess(data.data)); // Update with correct action and payload
          const cookieCanBeSet = areCookiesEnabled();
          if (!cookieCanBeSet) {
            localStorage.setItem(
              "chat-app-token",
              JSON.stringify(data.data.token)
            );
          }
        }

        setTimeout(() => {
          naviagte("/");
        }, 4000);
      }
    } catch (error) {
      setError(
        (error as Error).message || "An error occurred during registration"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        error={error}
        success={success}
        title="Register"
        description="Create a new account"
        footerLinkText="Already Logged in? Login"
        footerLinkTo="/auth/login"
        onClick={(e) =>
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        buttonText="Register"
      >
        <form className="space-y-3">
          <EachInput
            type="string"
            state={username}
            setState={setUsername}
            placeholder="Enter your username..."
          />
          <EachInput
            type="email"
            state={email}
            setState={setEmail}
            placeholder="Enter your email..."
          />
          <EachInput
            type="password"
            state={password}
            setState={setPassword}
            placeholder="Enter your password..."
          />
        </form>
      </AuthCard>
    </div>
  );
};

export default Register;

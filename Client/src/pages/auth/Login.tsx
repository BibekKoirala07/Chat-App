import React, { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import EachInput from "@/components/auth/EachInput";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/store";
import areCookiesEnabled from "@/utils/areCookiesEnabled";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const url =
    import.meta.env.VITE_NODE_ENV == "production"
      ? import.meta.env.VITE_PROD_BACKEND_URL
      : import.meta.env.VITE_DEV_BACKEND_URL;

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    // Frontend validation
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

    setError(null);

    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      console.log("data in login", data);

      setIsLoading(false);

      if (data.success) {
        console.log("user cookie enalbed", navigator.cookieEnabled);
        console.log("Login is success");
        setSuccess("Login successful!");
        dispatch(loginSuccess(data.data));
        console.log("data in login", data);
        const cookieCanBeSet = areCookiesEnabled();
        if (!cookieCanBeSet) {
          localStorage.setItem("chat-app-token", JSON.stringify(data.token));
        }
        navigate("/");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      setError((error as Error).message || "An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        error={error}
        success={success}
        title="Login"
        buttonText="Login"
        description="Access your account"
        footerLinkText="Don't have an account? Register"
        footerLinkTo="/auth/register"
        onClick={(e) =>
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
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
          <div className="flex justify-end text-sm">
            <Link to={"/auth/forgot-password"} className="text-blue-600">
              forgot password?
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
};

export default Login;

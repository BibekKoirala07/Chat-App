import React, { useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import EachInput from "@/components/auth/EachInput";

const ForgotPassword = () => {
  const url =
    import.meta.env.VITE_NODE_ENV == "production"
      ? import.meta.env.VITE_PROD_BACKEND_URL
      : import.meta.env.VITE_DEV_BACKEND_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestPasswordReset = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setIsLoading(true);

    console.log("activated");

    // Validation
    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);

    try {
      const response = await fetch(`${url}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include", // Include authentication token in requests
      });

      const data = await response.json();

      console.log("data", data);
      setIsLoading(false);

      if (!data.success) {
        setError(data.message || "Request failed");
      } else {
        setSuccess("Reset link sent to your email!");
        setEmail(""); // Clear email input on success
      }
    } catch (error) {
      setError(
        (error as Error).message || "An error occurred during the request"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        onClick={(e) =>
          handleRequestPasswordReset(
            e as unknown as React.FormEvent<HTMLFormElement>
          )
        }
        error={error}
        success={success}
        title="Forgot Password"
        description="Enter your email to receive a password reset link"
        footerLinkText="Remember your password? Login"
        footerLinkTo="/auth/login"
        buttonText="Request Password Reset" // Custom button text
      >
        <form className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <EachInput
              type="email"
              state={email}
              setState={setEmail}
              placeholder="Enter your Email..."
            />
          </div>
        </form>
      </AuthCard>
    </div>
  );
};

export default ForgotPassword;

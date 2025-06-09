import React, { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";
import { register } from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface SignupProps {
  onSignup: (userData: any) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await register({ name, email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.user.id);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onSignup(response.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Registration failed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-light)] fade-in">
      <div className="card bg-white dark:bg-[var(--bg-light)] p-8 w-full max-w-md dark:glass">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center text-[var(--primary)] hover:text-[var(--secondary)] transition-all duration-200"
          aria-label="Go to home"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
          Create an Account
        </h2>
        {error && (
          <div
            className="bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)] px-4 py-2 rounded-lg mb-4 text-center fade-in"
            role="alert"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 w-full p-3 border-none rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 w-full p-3 border-none rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 w-full p-3 border-none rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="mt-1 w-full p-3 border-none rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            className="button-primary w-full flex items-center justify-center gap-2"
            disabled={isLoading}
            aria-label="Sign up"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <UserPlus size={18} />
                Sign Up
              </>
            )}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[var(--primary)] hover:text-[var(--secondary)] hover:underline transition-all duration-200"
            aria-label="Go to login"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;

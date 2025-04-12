"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [isVercelEnv, setIsVercelEnv] = useState(false);

  // Show demo mode banner on component mount and check environment
  useEffect(() => {
    // Check if we're in a Vercel environment
    const isVercel = window.location.hostname.includes('vercel.app');
    setIsVercelEnv(isVercel);
    
    // Always enable demo mode on Vercel or if demo mode is enabled locally
    setDemoMode(true);
  }, []);

  const handleDemoLogin = () => {
    // Redirect to sign-in page
    router.push("/sign-in");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // In demo mode or Vercel environment, don't actually try to register
    if (demoMode || isVercelEnv) {
      setError("Account creation is disabled in demo mode. Please use the provided demo accounts to sign in.");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);

    // Call the sign-up API
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      // Handle response with better error handling
      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }
      
      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground mt-2">Sign up to access the dashboard</p>
          {isVercelEnv && (
            <p className="text-sm font-medium text-yellow-600 mt-2">
              Demo Mode Active
            </p>
          )}
        </div>

        {(demoMode || isVercelEnv) && (
          <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <h3 className="font-bold">Demo Mode Active</h3>
            <p className="mb-3">Account creation is currently disabled in demo mode.</p>
            <p className="mb-2">Please use one of these demo accounts instead:</p>
            <ul className="list-disc pl-5 mb-3">
              <li>Admin: admin@example.com / password123</li>
              <li>User: user@example.com / password123</li>
            </ul>
            <button
              onClick={handleDemoLogin}
              className="w-full py-2 px-4 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Go to Sign In
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded-md"
              placeholder="you@example.com"
              disabled={demoMode || isVercelEnv || isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded-md"
              disabled={demoMode || isVercelEnv || isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-2 border rounded-md"
              disabled={demoMode || isVercelEnv || isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={demoMode || isVercelEnv || isLoading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-sm">
          <p>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  // Clear any previous errors on component mount
  useEffect(() => {
    setError("");
    // Display environment info in development for debugging
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(`APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    }
  }, []);

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setShowDemoHelp(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        setError("Email and password are required");
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }

      // Call the sign-in API with error handling
      let response;
      try {
        response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });
      } catch (fetchError) {
        console.error("Network error during fetch:", fetchError);
        setError("Network error. Please check your internet connection and try again.");
        setShowDemoHelp(true);
        setIsLoading(false);
        return;
      }

      // Handle response text - use try-catch for safety
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (textError) {
        console.error("Error getting response text:", textError);
        setError("Failed to read server response. Please try again later.");
        setShowDemoHelp(true);
        setIsLoading(false);
        return;
      }

      // Try to parse the JSON
      let data;
      try {
        // Make sure we have a non-empty string before parsing
        if (!responseText || responseText.trim() === "") {
          throw new Error("Empty response from server");
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Raw response:", responseText);
        setError("Server returned an invalid response. Try using demo credentials.");
        setShowDemoHelp(true);
        setIsLoading(false);
        return;
      }

      // If the API suggests using demo mode, show the demo help
      if (data.demoMode === true) {
        setShowDemoHelp(true);
      }

      // Handle unsuccessful responses
      if (!response.ok) {
        setError(data?.error || `Error ${response.status}: ${response.statusText || "Unknown error"}`);
        setIsLoading(false);
        return;
      }

      // Check for success flag
      if (!data.success) {
        setError(data?.error || "Sign in failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - redirect
      console.log("Sign in successful, redirecting to:", redirectUrl);
      router.push(redirectUrl);
    } catch (error: any) {
      console.error("Unhandled error during sign in:", error);
      setError(error?.message || "An unexpected error occurred. Please try again later.");
      setShowDemoHelp(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {showDemoHelp && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <p className="font-medium mb-2">Use demo credentials:</p>
            <div className="space-y-2">
              <button 
                onClick={() => handleDemoLogin('admin@example.com')}
                className="w-full text-left px-3 py-2 bg-yellow-50 hover:bg-yellow-200 rounded"
              >
                👑 Admin user: admin@example.com / password123
              </button>
              <button 
                onClick={() => handleDemoLogin('user@example.com')}
                className="w-full text-left px-3 py-2 bg-yellow-50 hover:bg-yellow-200 rounded"
              >
                👤 Regular user: user@example.com / password123
              </button>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-xs">
            {debugInfo}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm">
          <p>
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Check if we're in demo mode
  useState(() => {
    // We can't directly access environment variables on the client
    // This is a workaround to check if the app is running in demo mode
    fetch('/api/auth/demo-check')
      .then(res => res.json())
      .then(data => {
        setIsDemoMode(data.demoMode === true);
      })
      .catch(() => {
        // Silently fail - assume not in demo mode
        setIsDemoMode(false);
      });
  });

  async function handleDemoLogin() {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email || 'demo@example.com',
          password: 'demo-password'
        })
      });
      
      if (!response.ok) {
        throw new Error('Demo login failed');
      }
      
      const data = await response.json();
      
      // Store the token in localStorage
      localStorage.setItem('auth_token', data.token);
      
      toast({
        title: "Demo Login Successful",
        description: "Welcome to the demo account!"
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Login Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    // If in demo mode, use the demo login
    if (isDemoMode) {
      return handleDemoLogin();
    }

    try {
      // Implement your regular authentication here
      // For example, with Clerk or custom auth
      
      // For now, we'll just use the demo login as a placeholder
      await handleDemoLogin();
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
          {isDemoMode && (
            <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-sm rounded-md text-center">
              Demo Mode Active: You can use any email/password
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign up
            </Link>
          </div>
          
          {isDemoMode && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login with Demo Account"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 
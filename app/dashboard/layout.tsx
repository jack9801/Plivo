"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Grid, AlertTriangle, Box, Users, Home, LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
  organizationId?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePath, setActivePath] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Set active path
    setActivePath(window.location.pathname);
    
    // Authentication check
    const checkAuth = async () => {
      try {
        // First, check if we have a cookie
        const hasCookie = document.cookie.includes("__clerk_db_jwt");
        
        if (hasCookie) {
          // Try to get user info from /api/auth/me
          try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
              const data = await response.json();
              console.log('Current user:', data);
              if (data.user) {
                setCurrentUser(data.user);
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
          
          // If API failed but we have a cookie, still authenticate
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // No cookie, redirect to sign-in
        router.push("/sign-in?redirect_url=" + encodeURIComponent(window.location.href));
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push("/sign-in?redirect_url=" + encodeURIComponent(window.location.href));
      }
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  // Get organization info to display
  const orgId = currentUser?.organizationId || '';
  const orgName = orgId.startsWith('demo-') ? (orgId === 'demo-admin-org' ? 'Admin Demo Org' : 'User Demo Org') : 'Your Organization';

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#1E1E1E] text-white h-full flex flex-col justify-between">
        <div>
          <div className="p-4 mt-2">
            <h2 className="text-xl font-bold">Status Page</h2>
            <div className="mt-1 text-xs text-gray-400">
              {currentUser?.email || 'Anonymous User'} 
              <span className="block">{orgName}</span>
            </div>
          </div>
          <nav className="p-2">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard"
                  className={`flex items-center gap-3 p-3 rounded hover:bg-[#2E2E2E] ${
                    activePath === "/dashboard" ? "bg-[#2E2E2E]" : ""
                  }`}
                >
                  <Grid size={20} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard/organizations"
                  className={`flex items-center gap-3 p-3 rounded hover:bg-[#2E2E2E] ${
                    activePath.includes("/organizations") ? "bg-[#2E2E2E]" : ""
                  }`}
                >
                  <Box size={20} />
                  <span>Organizations</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard/incidents"
                  className={`flex items-center gap-3 p-3 rounded hover:bg-[#2E2E2E] ${
                    activePath.includes("/incidents") ? "bg-[#2E2E2E]" : ""
                  }`}
                >
                  <AlertTriangle size={20} />
                  <span>Incidents</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard/services"
                  className={`flex items-center gap-3 p-3 rounded hover:bg-[#2E2E2E] ${
                    activePath.includes("/services") ? "bg-[#2E2E2E]" : ""
                  }`}
                >
                  <Box size={20} />
                  <span>Services</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/"
                  className={`flex items-center gap-3 p-3 rounded hover:bg-[#2E2E2E] ${
                    activePath === "/" ? "bg-[#2E2E2E]" : ""
                  }`}
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="p-2 mb-4">
          <button 
            onClick={() => {
              // Delete auth cookie
              document.cookie = "__clerk_db_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              router.push("/sign-in");
            }}
            className="flex items-center gap-3 p-3 rounded hover:bg-[#2E2E2E] w-full text-left"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-white">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
} 
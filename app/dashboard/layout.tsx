"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Grid, AlertTriangle, Box, Users, Home, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePath, setActivePath] = useState("");

  useEffect(() => {
    // Set active path
    setActivePath(window.location.pathname);
    
    // Check for authentication
    const hasCookie = document.cookie.includes("__clerk_db_jwt");
    setIsAuthenticated(hasCookie);
    setIsLoading(false);

    if (!hasCookie) {
      router.push("/sign-in?redirect_url=" + encodeURIComponent(window.location.href));
    }
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

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#1E1E1E] text-white h-full flex flex-col justify-between">
        <div>
          <div className="p-4 mt-2">
            <h2 className="text-xl font-bold">Status Page</h2>
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
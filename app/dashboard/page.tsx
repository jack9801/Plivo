"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  
  useEffect(() => {
    // Simulate loading and then show the dashboard
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Dashboard...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {demoMode && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded mb-6">
          <h3 className="font-bold text-lg mb-2">🚀 Demo Mode Active</h3>
          <p>You're viewing the demo version of the Status Page application.</p>
          <p className="mt-2">Some features might be limited, but you can explore the UI and functionality.</p>
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Services</h2>
          <div className="text-4xl font-bold text-primary">5</div>
          <p className="text-gray-500 mt-2">All services operational</p>
          <Link href="/dashboard/services" className="text-primary hover:underline mt-4 inline-block">
            Manage Services →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Incidents</h2>
          <div className="text-4xl font-bold text-yellow-500">1</div>
          <p className="text-gray-500 mt-2">Active incident</p>
          <Link href="/dashboard/incidents" className="text-primary hover:underline mt-4 inline-block">
            View Incidents →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Team</h2>
          <div className="text-4xl font-bold text-primary">3</div>
          <p className="text-gray-500 mt-2">Team members</p>
          <Link href="/dashboard/team" className="text-primary hover:underline mt-4 inline-block">
            Manage Team →
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ul className="divide-y">
          <li className="py-3">
            <span className="text-gray-500 mr-2">Today at 10:23 AM</span>
            <span className="font-medium">API Service</span> - Degraded performance reported
          </li>
          <li className="py-3">
            <span className="text-gray-500 mr-2">Yesterday at 2:45 PM</span>
            <span className="font-medium">Website</span> - Scheduled maintenance completed
          </li>
          <li className="py-3">
            <span className="text-gray-500 mr-2">May 15, 2023</span>
            <span className="font-medium">Database</span> - Performance optimizations applied
          </li>
        </ul>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/incidents/new" className="bg-primary text-white p-3 rounded-md text-center hover:bg-primary/90 transition-colors">
            Create Incident
          </Link>
          <Link href="/dashboard/services/new" className="bg-green-600 text-white p-3 rounded-md text-center hover:bg-green-700 transition-colors">
            Add Service
          </Link>
          <Link href="/status" className="bg-blue-600 text-white p-3 rounded-md text-center hover:bg-blue-700 transition-colors">
            View Status Page
          </Link>
        </div>
      </div>
    </div>
  );
} 
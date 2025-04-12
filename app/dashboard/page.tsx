"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  organizationId?: string;
}

interface Service {
  id: string;
  name: string;
  status: string;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [organization, setOrganization] = useState({ name: 'Loading...' });
  
  useEffect(() => {
    // Check environment
    const isVercel = window.location.hostname.includes('vercel.app');
    setDemoMode(isVercel);
    
    const fetchUserAndData = async () => {
      try {
        // Try to get current user
        let orgId = '';
        
        try {
          const userResponse = await fetch('/api/auth/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user) {
              setCurrentUser(userData.user);
              orgId = userData.user.organizationId || '';
              
              // If user doesn't have org ID but we're in demo mode, use demo org
              if (!orgId && isVercel) {
                orgId = 'demo-admin-org';
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          if (isVercel) {
            // If error in Vercel, use demo organization
            orgId = 'demo-admin-org';
          }
        }
        
        // If we still don't have an org ID, try to get it from the organization API
        if (!orgId) {
          try {
            const orgsResponse = await fetch('/api/organizations');
            if (orgsResponse.ok) {
              const orgs = await orgsResponse.json();
              if (orgs && orgs.length > 0) {
                orgId = orgs[0].id;
                setOrganization({ name: orgs[0].name });
              }
            }
          } catch (error) {
            console.error('Error fetching organizations:', error);
          }
        }
        
        // If we have an organization ID, fetch services and incidents
        if (orgId) {
          console.log('Fetching data for organization:', orgId);
          
          // Fetch organization details
          try {
            const orgResponse = await fetch(`/api/organizations/${orgId}`);
            if (orgResponse.ok) {
              const org = await orgResponse.json();
              setOrganization(org);
            }
          } catch (error) {
            console.error('Error fetching organization details:', error);
          }
          
          // Fetch services
          try {
            const servicesResponse = await fetch(`/api/services?organizationId=${orgId}`);
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json();
              setServices(servicesData);
            }
          } catch (error) {
            console.error('Error fetching services:', error);
          }
          
          // Fetch incidents
          try {
            const incidentsResponse = await fetch(`/api/incidents?organizationId=${orgId}`);
            if (incidentsResponse.ok) {
              const incidentsData = await incidentsResponse.json();
              setIncidents(incidentsData);
              
              // Filter active incidents
              const active = incidentsData.filter((incident: any) => 
                incident.status !== 'RESOLVED' && incident.status !== 'COMPLETED'
              );
              setActiveIncidents(active);
            }
          } catch (error) {
            console.error('Error fetching incidents:', error);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchUserAndData();
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
  
  // Count operational services
  const operationalServices = services.filter(service => service.status === 'OPERATIONAL').length;
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {demoMode && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded mb-6">
          <h3 className="font-bold text-lg mb-2">🚀 Demo Mode Active</h3>
          <p>You're viewing the demo version of the Status Page application.</p>
          <p className="mt-2">Some features might be limited, but you can explore the UI and functionality.</p>
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-6">{organization.name || 'Dashboard'} Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Services</h2>
          <div className="text-4xl font-bold text-primary">{services.length}</div>
          <p className="text-gray-500 mt-2">
            {operationalServices === services.length 
              ? 'All services operational' 
              : `${operationalServices}/${services.length} operational`}
          </p>
          <Link href="/dashboard/services" className="text-primary hover:underline mt-4 inline-block">
            Manage Services →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Incidents</h2>
          <div className={`text-4xl font-bold ${activeIncidents.length > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
            {activeIncidents.length}
          </div>
          <p className="text-gray-500 mt-2">
            {activeIncidents.length === 0 
              ? 'No active incidents' 
              : activeIncidents.length === 1 
                ? '1 active incident' 
                : `${activeIncidents.length} active incidents`}
          </p>
          <Link href="/dashboard/incidents" className="text-primary hover:underline mt-4 inline-block">
            View Incidents →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Organization</h2>
          <div className="text-4xl font-bold text-primary">{organization.name?.charAt(0) || '?'}</div>
          <p className="text-gray-500 mt-2">{organization.name || 'Your Organization'}</p>
          <Link href="/dashboard/organizations" className="text-primary hover:underline mt-4 inline-block">
            Manage Organization →
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {incidents.length > 0 ? (
          <ul className="divide-y">
            {incidents.slice(0, 3).map(incident => (
              <li key={incident.id} className="py-3">
                <span className="text-gray-500 mr-2">
                  {new Date(incident.createdAt).toLocaleString()}
                </span>
                <span className="font-medium">{incident.title}</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full 
                  ${incident.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 
                    incident.status === 'INVESTIGATING' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {incident.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No incidents reported yet.</p>
        )}
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
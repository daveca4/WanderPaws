'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import PermissionGate from './PermissionGate';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    // Redirect will happen automatically via the auth context
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Link href="/" className="font-semibold text-primary-600 text-xl flex items-center">
          <span className="text-2xl mr-2">🐾</span>
          <span>WanderPaws</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Admin Actions */}
        <PermissionGate action="access" resource="admin-dashboard">
          <Link 
            href="/admin" 
            className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
          >
            Admin Panel
          </Link>
        </PermissionGate>

        {/* Notifications */}
        <button className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        
        {/* User Menu */}
        <div className="relative">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80" 
                alt="User" 
                width={32} 
                height={32} 
              />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {user ? user.email.split('@')[0] : 'Guest'}
              </span>
              {user && (
                <span className="block text-xs text-gray-500 capitalize">
                  {user.role}
                </span>
              )}
            </div>
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
              {user ? (
                <>
                  <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
                    Signed in as <span className="font-medium text-gray-900">{user.email}</span>
                  </div>
                  
                  <PermissionGate action="read" resource="owners" resourceOwnerId={user.profileId}>
                    <Link 
                      href={`/owners/${user.profileId}`} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                  </PermissionGate>
                  
                  <PermissionGate action="read" resource="walkers" resourceOwnerId={user.profileId}>
                    <Link 
                      href={`/walkers/${user.profileId}`} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                  </PermissionGate>
                  
                  <PermissionGate action="access" resource="owner-dashboard">
                    <Link 
                      href="/owner-dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Owner Dashboard
                    </Link>
                  </PermissionGate>
                  
                  <PermissionGate action="access" resource="walker-dashboard">
                    <Link 
                      href="/walker-dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Walker Dashboard
                    </Link>
                  </PermissionGate>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 
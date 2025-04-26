"use client";
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ProfileImage from './ProfileImage';
import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi';
import { usePathname } from 'next/navigation';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState) {
      setIsSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (isMounted) {
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
    }
  };

  const getPageTitle = () => {
    const basePath = pathname.split('/')[1];
    const titles = {
      'dashboard': 'Dashboard',
      'medicines': 'Medicine Inventory',
      'expired-medicines': 'Expired Medicines',
      'archive': 'Archived Medicines',
      'reports': 'Reports',
      'prescription': 'Prescription Management',
    };
    return titles[basePath] || 'Dashboard';
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 print:block">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main 
        className="flex-1 overflow-y-auto" 
        style={{
          marginLeft: isSidebarOpen ? '16rem' : '5rem',
          transition: 'margin-left 300ms ease-in-out'
        }}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 print:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                </div>
              </div>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <HiOutlineBell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              <div className="flex items-center space-x-2">
                <ProfileImage name="Milo Galendez" size="md" />
                {isSidebarOpen && (
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">Milo Galendez</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
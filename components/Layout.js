"use client";
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ProfileImage from './ProfileImage';
import { HiOutlineBell } from 'react-icons/hi';
import { usePathname } from 'next/navigation';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
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

  // Function to get the current page title based on route
  const getPageTitle = () => {
    const basePath = pathname.split('/')[1]; // Get the first part of the path
    switch(basePath) {
      case 'dashboard':
        return 'Dashboard';
      case 'medicines':
        return 'Medicines';
      case 'expired-medicines':
        return 'Expired-Medicines';
      case 'archive':
        return 'Archive';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard'; // Default fallback
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 print:block">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main 
        className="flex-1 p-8 print:p-0 print:w-full overflow-y-auto" 
        style={{
          marginLeft: isSidebarOpen ? '16rem' : '5rem',
          transition: 'margin-left 300ms ease-in-out'
        }}
      >
        {/* Top Section with Dynamic Title */}
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md mb-8 print:hidden">
          <h1 className="text-2xl font-semibold capitalize">{getPageTitle()}</h1>
          <div className="flex items-center space-x-6">
            <HiOutlineBell className="text-2xl text-gray-600 cursor-pointer hover:text-gray-800 transition" />
            <ProfileImage name="Milo Galendez" imageUrl="" />
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default Layout;
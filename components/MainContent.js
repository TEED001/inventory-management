"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      
      {/* Main Content Area */}
      <div className={`
        flex-1 transition-all duration-300 overflow-y-auto
        ${isSidebarOpen ? "ml-64" : "ml-20"}
        ${isMobile && "ml-0"}
      `}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-10 bg-white p-4 border-b flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 mr-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
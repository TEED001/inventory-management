"use client";
import Link from "next/link";
import { FaPills, FaFileAlt, FaChartBar, FaThLarge, FaBars,FaTimes,FaSignOutAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Detect mobile and adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false); // Auto-close on mobile
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaThLarge className="text-lg" /> },
    { path: "/medicines", label: "Medicines", icon: <FaPills className="text-lg" /> },
    { path: "/expired-medicines", label: "Expired", icon: <FaFileAlt className="text-lg" /> },
    { path: "/monthly-reports", label: "Reports", icon: <FaChartBar className="text-lg" /> },
  ];

  return (
    <>
      {/* Mobile Hamburger (Always visible) */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <FaTimes className="text-gray-700 text-xl" />
          ) : (
            <FaBars className="text-gray-700 text-xl" />
          )}
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white shadow-lg h-screen p-4 transition-all duration-300 ease-in-out 
          flex flex-col fixed top-0 left-0 z-40
          ${isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
          ${isMobile ? "pt-16" : ""}
        `}
        aria-label="Sidebar"
      >
        {/* Desktop Toggle (inside sidebar) */}
        {!isMobile && (
          <div className="flex justify-between items-center mb-8">
            {isOpen && (
              <Image
                src="/images/logo.png"
                alt="MOPH Logo"
                width={144}
                height={40}
                priority
              />
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isOpen ? (
                <FaTimes className="text-gray-700 text-xl" />
              ) : (
                <FaBars className="text-gray-700 text-xl" />
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-grow">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    pathname === item.path
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isOpen && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <FaSignOutAlt className="text-lg" />
              <span className="ml-3 text-sm font-medium">Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
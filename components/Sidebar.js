"use client";
import { Home, PieChart, Pill, ClipboardList, Archive, Box, ChevronDown, Menu, Calculator , X, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState({});
  const [activeHover, setActiveHover] = useState(null);

  // Memoized menu items to prevent unnecessary recalculations
  const menuItems = useMemo(() => [
    {
      title: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/dashboard',
      subItems: []
    },
    {
      title: 'QR Scanner',
      icon: <QrCode className="w-5 h-5" />,  // Changed from <Home> to <QrCode>
      path: '/qrscanner',  // Also changed path from '/dashboard' to '/qr-scanner'
      subItems: []
    },
    {
      title: 'Medicine Management',
      icon: <Pill className="w-5 h-5" />,
      path: '/medicine-management',
      subItems: [
        { title: 'Medicine', path: '/medicines', icon: <Pill className="w-4 h-4" /> },
        { title: 'Expired Medicine', path: '/expired-medicines', icon: <Archive className="w-4 h-4" /> },
        { title: 'Archived Medicines', path: '/archive', icon: <Box className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Prescription List',
      icon: <ClipboardList className="w-5 h-5" />,
      path: '/prescription',
      subItems: []
    },
    {
      title: 'Billing',
      icon: <Calculator className="w-5 h-5" />,
      path: '/calculate-medicine',
      subItems: []
    }
  ], []);

  // Persist expanded state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpandedItems');
    if (savedState) {
      try {
        setExpandedItems(JSON.parse(savedState));
      } catch (e) {
        localStorage.removeItem('sidebarExpandedItems');
      }
    }
  }, []);

  // Optimized path matching
  const isActive = useCallback((path) => {
    return path === '/' ? pathname === path : pathname.startsWith(path);
  }, [pathname]);

  // Combined click handler with memoization
  const handleItemClick = useCallback((item) => {
    if (!item.subItems.length) return;

    const shouldOpenSidebar = !isOpen;
    const shouldExpand = shouldOpenSidebar || !expandedItems[item.title];

    if (shouldOpenSidebar) {
      toggleSidebar();
    }

    const updateState = () => {
      const newState = { ...expandedItems, [item.title]: shouldExpand };
      setExpandedItems(newState);
      localStorage.setItem('sidebarExpandedItems', JSON.stringify(newState));
    };

    // Only delay if we're opening the sidebar
    shouldOpenSidebar ? setTimeout(updateState, 100) : updateState();
  }, [isOpen, expandedItems, toggleSidebar]);

  // Memoized sidebar classes
  const sidebarClasses = useMemo(() => (
    `fixed top-0 left-0 h-full z-20 transition-all duration-300 ease-in-out 
    bg-white shadow-xl ${isOpen ? 'w-64' : 'w-20'} print:hidden border-r border-gray-200`
  ), [isOpen]);

  // Memoized header classes
  const headerClasses = useMemo(() => (
    `flex items-center p-4 border-b border-gray-200 bg-white 
    ${isOpen ? 'justify-between' : 'justify-center'}`
  ), [isOpen]);

  return (
    <nav className={sidebarClasses}>
      {/* Sidebar Header */}
      <div className={headerClasses}>
        {isOpen && (
          <div className="flex items-center space-x-3">
            <Image 
              src="/images/logo.png"
              alt="System Logo" 
              width={120}
              height={40} 
              className="h-10 w-auto transition-opacity duration-300"
              priority
            />
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="overflow-y-auto h-[calc(100%-68px)] custom-scrollbar">
        <nav className="p-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const itemClasses = `
              flex items-center justify-between p-3 mx-1 rounded-lg cursor-pointer 
              transition-all duration-200
              ${active ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'}
              ${!isOpen ? 'justify-center px-0 mx-0' : ''}
            `;

            return (
              <div key={item.title} className="mb-1">
                {item.subItems.length > 0 ? (
                  <div 
                    className={itemClasses}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setActiveHover(item.title)}
                    onMouseLeave={() => setActiveHover(null)}
                  >
                    <div className="flex items-center">
                      <span className={`${active ? 'text-indigo-600' : 'text-gray-500'} transition-colors`}>
                        {item.icon}
                      </span>
                      {isOpen && <span className="ml-3 font-medium">{item.title}</span>}
                    </div>
                    {isOpen && item.subItems.length > 0 && (
                      <span className={`transition-transform duration-200 ${expandedItems[item.title] ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                ) : (
                  <Link href={item.path} passHref legacyBehavior>
                    <div 
                      className={itemClasses}
                      onMouseEnter={() => setActiveHover(item.title)}
                      onMouseLeave={() => setActiveHover(null)}
                    >
                      <div className="flex items-center">
                        <span className={`${active ? 'text-indigo-600' : 'text-gray-500'} transition-colors`}>
                          {item.icon}
                        </span>
                        {isOpen && <span className="ml-3 font-medium">{item.title}</span>}
                      </div>
                    </div>
                  </Link>
                )}

                {isOpen && item.subItems.length > 0 && expandedItems[item.title] && (
                  <div className="ml-8 mt-1 space-y-1 animate-fadeIn">
                    {item.subItems.map((subItem) => {
                      const subActive = isActive(subItem.path);
                      return (
                        <Link href={subItem.path} key={subItem.title} passHref legacyBehavior>
                          <a className={`
                            flex items-center p-2 pl-4 rounded-lg cursor-pointer 
                            transition-all duration-200 text-sm
                            ${subActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}
                          `}>
                            {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                            {subItem.title}
                          </a>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {!isOpen && activeHover === item.title && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-30">
                    {item.title}
                    {item.subItems.length > 0 && expandedItems[item.title] && (
                      <div className="mt-1 space-y-1">
                        {item.subItems.map(subItem => (
                          <div key={subItem.title} className="whitespace-nowrap">
                            {subItem.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #ddd; 
          border-radius: 2px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </nav>
  );
};

export default Sidebar;
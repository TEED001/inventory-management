"use client";
import { Home, PieChart, Pill, ClipboardList, Calculator, Archive, 
Box, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleItemClick = (e, item) => {
    // Only toggle if clicking the parent item (not a sub-item)
    const isParentClick = e.currentTarget === e.target.closest('.parent-item');
    
    if (item.subItems.length > 0 && isParentClick) {
      e.preventDefault();
      if (!isOpen) {
        toggleSidebar();
        setTimeout(() => toggleItem(item.title), 100);
      } else {
        toggleItem(item.title);
      }
    }
  };

  const handleSubItemClick = (e) => {
    // Stop propagation to prevent the parent item from handling the click
    e.stopPropagation();
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/dashboard',
      subItems: []
    },
    {
      title: 'Medicine Management',
      icon: <Pill className="w-5 h-5" />,
      path: '/medicine-management',
      subItems: [
        { title: 'Medicine', path: '/medicines', icon: <Pill className="w-4 h-4" /> },
        { title: 'Expired Medicine', path: '/expired-medicines', icon: <Archive className="w-4 h-4" /> },
        { title: 'Archive', path: '/medicine-management/archive', icon: <Box className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Reports',
      icon: <PieChart className="w-5 h-5" />,
      path: '/reports',
      subItems: [
        { title: 'Inventory Report', path: '/reports/inventory', icon: <ClipboardList className="w-4 h-4" /> },
        { title: 'Monthly Report', path: '/reports/monthly', icon: <PieChart className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Prescription List',
      icon: <ClipboardList className="w-5 h-5" />,
      path: '/prescription',
      subItems: []
    },
    {
      title: 'Calculate Medicine',
      icon: <Calculator className="w-5 h-5" />,
      path: '/calculate-medicine',
      subItems: []
    }
  ];

  

  return (
    <nav className={`
      fixed top-0 left-0 h-full z-20 transition-all duration-300 ease-in-out 
      bg-gradient-to-b from-white to-gray-50 shadow-xl
      ${isOpen ? 'w-64' : 'w-20'} print:hidden border-r border-gray-200
    `}>
      
      {/* Sidebar Header */}
      <div className={`
        flex items-center p-4 border-b border-gray-200 
        ${isOpen ? 'justify-between' : 'justify-center'}
        bg-white
      `}>
        {isOpen && (
          <div className="flex-1 flex justify-center">
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
          {menuItems.map((item) => (
            <div key={item.title} className="mb-1">
              <Link href={item.path} passHref legacyBehavior>
                <div 
                  className={`
                    parent-item flex items-center justify-between p-3 mx-1 rounded-lg cursor-pointer 
                    transition-all duration-200
                    ${pathname === item.path ? 
                      'bg-blue-600 text-white shadow-md' : 
                      'hover:bg-gray-100 text-gray-700 hover:text-gray-900'}
                    ${!isOpen ? 'justify-center px-0 mx-0' : ''}
                  `}
                  onClick={(e) => handleItemClick(e, item)}
                >
                  <div className="flex items-center">
                    <span className={`
                      ${pathname === item.path ? 'text-white' : 'text-gray-600'}
                      transition-colors
                    `}>
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
              </Link>

              {isOpen && item.subItems.length > 0 && expandedItems[item.title] && (
                <div className="ml-8 mt-1 space-y-1 animate-fadeIn">
                  {item.subItems.map((subItem) => (
                    <Link href={subItem.path} key={subItem.title} passHref legacyBehavior>
                      <a 
                        className={`
                          flex items-center p-2 pl-4 rounded-lg cursor-pointer 
                          transition-all duration-200 text-sm
                          ${pathname === subItem.path ? 
                            'bg-blue-100 text-blue-600 font-medium' : 
                            'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}
                        `}
                        onClick={(e) => e.stopPropagation()} // Prevent event from bubbling to parent
                      >
                        {subItem.icon && (
                          <span className="mr-2">
                            {subItem.icon}
                          </span>
                        )}
                        {subItem.title}
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Add some global styles for the sidebar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};

export default Sidebar;
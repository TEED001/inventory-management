"use client";
import { Home, Users, FileText, Package, Archive, PieChart, Pill, Settings, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
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

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Home size={20} />,
      path: '/dashboard',
      subItems: []
    },
    {
      title: 'Medicines',
      icon: <Pill size={20} />,
      path: '/medicines',
      subItems: []
    },
    {
      title: 'Patients',
      icon: <Users size={20} />,
      path: '/Testpage',
      subItems: [
        { title: 'Patient List', path: '/Testpage' },
        { title: 'Add Patient', path: '/patients/add' },
        { title: 'Patient Records', path: '/patients/records' }
      ]
    },
    {
      title: 'Reports',
      icon: <PieChart size={20} />,
      path: '/Testpage',
      subItems: [
        { title: 'Inventory Report', path: '/Testpage' },
        { title: 'Sales Report', path: '/reports/sales' }
      ]
    },
    {
      title: 'Settings',
      icon: <Settings size={20} />,
      path: '/Testpage',
      subItems: [
        { title: 'User Management', path: '/Testpage' },
        { title: 'System Settings', path: '/settings/system' }
      ]
    }
  ];

  return (
    <nav className={`fixed top-0 left-0 h-full bg-white shadow-lg z-20 transition-all duration-300 ease-in-out 
      ${isOpen ? 'w-64' : 'w-20'} print:hidden border-r border-gray-200`}>
      
      {/* Sidebar Header */}
      <div className={`flex items-center p-4 border-b border-gray-200 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {isOpen && (
          <div className="flex-1 flex justify-center">
            <Image 
              src="/images/logo.png"
              alt="System Logo" 
              width={120}
              height={40} 
              className="h-10 w-auto"
            />
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="overflow-y-auto h-[calc(100%-60px)]">
        <nav className="mt-4">
          {menuItems.map((item) => (
            <div key={item.title} className="mb-1">
              <Link href={item.path} passHref legacyBehavior>
                <div 
                  className={`flex items-center justify-between p-3 mx-2 rounded-lg cursor-pointer transition-colors
                    ${pathname === item.path ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
                    ${!isOpen ? 'justify-center' : ''}`}
                  onClick={(e) => {
                    if (item.subItems.length > 0) {
                      e.preventDefault();
                      toggleItem(item.title);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className={`${pathname === item.path ? 'text-white' : 'text-gray-600'}`}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="ml-3">{item.title}</span>}
                  </div>
                  {isOpen && item.subItems.length > 0 && (
                    expandedItems[item.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </div>
              </Link>

              {isOpen && item.subItems.length > 0 && expandedItems[item.title] && (
                <div className="ml-10 mt-1">
                  {item.subItems.map((subItem) => (
                    <Link href={subItem.path} key={subItem.title} passHref legacyBehavior>
                      <div 
                        className={`p-2 pl-4 rounded-lg cursor-pointer text-sm transition-colors
                          ${pathname === subItem.path ? 'bg-blue-100 text-blue-600 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        {subItem.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </nav>
  );
};

export default Sidebar;
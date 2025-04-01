import Link from 'next/link';
import { FaPills, FaFileAlt, FaChartBar, FaThLarge, FaBars } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/router';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const isActive = (pathname) => router.pathname === pathname;

  return (
    <aside
    className={`bg-white shadow-md h-screen p-4 transition-all duration-300 ease-in-out flex flex-col fixed top-0 left-0 ${
      isOpen ? 'w-64' : 'w-20'
    }`}
    style={{ height: '100vh' }} // Ensure it takes the full viewport height
  >
      <div className="flex justify-between items-center mb-6">
        {/* Logo */}
        <div className={`flex items-center transition-all duration-300 ease-in-out ${isOpen ? 'block' : 'hidden'}`}>
          <img
            src="/images/logo.png"
            alt="MOPH Logo"
            className={`w-36 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* Toggle Button (Top Right) */}
        <div className={`flex items-center ${!isOpen ? 'mt-7 ml-1.5' : ''}`}>
          <div className="flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 cursor-pointer">
              <FaBars className="text-gray-700 text-xl transition-colors duration-300 hover:text-gray-400 relative top-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          <li
            className={`rounded transition-colors duration-300 hover:bg-gray-200 ${
              isActive('/') ? 'bg-gray-200' : ''
            }`}
          >
            <Link href="/" className="flex items-center px-4 py-3 w-full">
              <FaThLarge className="mr-3 text-lg text-gray-700 flex-shrink-0 transition-colors duration-300 hover:text-gray-400" />
              <span className="text-sm text-gray-700">
                {isOpen && 'Dashboard'}
              </span>
            </Link>
          </li>
          <li
            className={`rounded transition-colors duration-300 hover:bg-gray-200 ${
              isActive('/medicines') ? 'bg-gray-200' : ''
            }`}
          >
            <Link href="/medicines" className="flex items-center px-4 py-3 w-full">
              <FaPills className="mr-3 text-lg text-gray-700 flex-shrink-0 transition-colors duration-300 hover:text-gray-400" />
              <span className="text-sm text-gray-700">
                {isOpen && 'Medicines'}
              </span>
            </Link>
          </li>
          <li
            className={`rounded transition-colors duration-300 hover:bg-gray-200 ${
              isActive('/expired-medicines') ? 'bg-gray-200' : ''
            }`}
          >
            <Link href="/expired-medicines" className="flex items-center px-4 py-3 w-full">
              <FaFileAlt className="mr-3 text-lg text-gray-700 flex-shrink-0 transition-colors duration-300 hover:text-gray-400" />
              <span className="text-sm text-gray-700">
                {isOpen && 'Expired Medicines'}
              </span>
            </Link>
          </li>
          <li
            className={`rounded transition-colors duration-300 hover:bg-gray-200 ${
              isActive('/monthly-reports') ? 'bg-gray-200' : ''
            }`}
          >
            <Link href="/monthly-reports" className="flex items-center px-4 py-3 w-full">
              <FaChartBar className="mr-3 text-lg text-gray-700 flex-shrink-0 transition-colors duration-300 hover:text-gray-400" />
              <span className="text-sm text-gray-700">
                {isOpen && 'Monthly Reports'}
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
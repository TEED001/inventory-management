import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const storedState = localStorage.getItem("sidebarOpen");
    if (storedState !== null) {
      setIsSidebarOpen(JSON.parse(storedState));
    }
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <main
        className={`p-4 transition-all duration-300 w-full ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;

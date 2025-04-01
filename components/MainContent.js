import { useState, useEffect, useCallback } from "react";

const MainContent = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const storedState = localStorage.getItem("sidebarOpen");
    if (storedState !== null) {
      setIsSidebarOpen(JSON.parse(storedState));
    }
  }, []);

  // Update localStorage whenever sidebar state changes
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", JSON.stringify(newState));
      return newState;
    });
  }, []);

  return (
    <main
      className={`p-4 transition-all duration-300 bg-white min-h-screen overflow-auto ${
        isSidebarOpen ? "ml-64" : "ml-20"
      }`}
    >
      {children}
    </main>
  );
};

export default MainContent;

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsCards from "./components/StatsCards";
import ProgressChart from "./components/ProgressChart";
import RecentOrders from "./components/RecentOrders";
import TeamStatus from "./components/TeamStatus";
import EquipmentStatus from "./components/EquipmentStatus";

import useSidebar from "../../hooks/useSidebar";

export default function DashboardPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    console.log("🟢 Dashboard montado");
    setDebugInfo((prev) => [...prev, "Dashboard montado"]);

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Modo debug - pressione D para ver logs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        console.log("📊 Debug Info:", debugInfo);
        alert("Debug Info:\n" + debugInfo.join("\n"));
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [debugInfo]);

  console.log("🔵 Dashboard renderizando...");

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-slate-900" : "bg-gray-100"
      } transition-colors duration-300`}
    >
      {/* Debug badge removed (was showing '✓ Dashboard OK') */}

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        darkMode={darkMode}
      />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1
              className={`text-3xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Dashboard Principal
            </h1>
            <p
              className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Visão geral da entressafra e manutenção industrial
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards darkMode={darkMode} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <ProgressChart darkMode={darkMode} />
            <TeamStatus darkMode={darkMode} />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <RecentOrders darkMode={darkMode} />
            <EquipmentStatus darkMode={darkMode} />
          </div>
        </main>
      </div>
    </div>
  );
}

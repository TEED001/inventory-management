"use client";
import { useState, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { 
  Pill, AlertTriangle, Calendar, Database, 
  QrCode, Info, List, PieChart as PieChartIcon 
} from "lucide-react";
import Layout from '@/components/Layout';

// Configuration constants
const CHART_CONFIG = {
  colors: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    secondary: '#8B5CF6'
  }
};

const INITIAL_MEDICINES = [
  { id: 1, name: 'Amoxicillin', count: 1245, category: 'Antibiotic', percentage: 29 },
  { id: 2, name: 'Ibuprofen', count: 982, category: 'Pain Relief', percentage: 23 },
  { id: 3, name: 'Lisinopril', count: 756, category: 'Blood Pressure', percentage: 18 },
  { id: 4, name: 'Metformin', count: 689, category: 'Diabetes', percentage: 16 },
  { id: 5, name: 'Atorvastatin', count: 621, category: 'Cholesterol', percentage: 14 },
];

const Dashboard = () => {
  // State management
  const [dashboardState, setDashboardState] = useState({
    mostPrescribed: INITIAL_MEDICINES,
    showScanner: false,
    scannedData: null,
    viewMode: 'list'
  });

  // Memoized stats to prevent unnecessary recalculations
  const stats = useMemo(() => [
    { 
      title: "Total Inventory", 
      value: "5,284", 
      icon: <Database className="h-5 w-5" />,
      change: "+12%",
      trend: "up",
      color: "bg-blue-100 text-blue-600"
    },
    { 
      title: "Expiring Soon", 
      value: "56", 
      icon: <Calendar className="h-5 w-5" />,
      change: "-8%",
      trend: "down",
      color: "bg-amber-100 text-amber-600"
    },
    { 
      title: "Daily Dispensed", 
      value: "384", 
      icon: <Pill className="h-5 w-5" />,
      change: "+15%",
      trend: "up",
      color: "bg-green-100 text-green-600"
    },
  ], []);

  // Handlers with useCallback for stable references
  const handleScan = useCallback(() => {
    const mockScannedMedicine = {
      id: 6,
      name: 'Omeprazole',
      count: 543,
      category: 'GI Drug',
      percentage: 12,
      lastScanned: new Date().toLocaleDateString(),
      trend: 'up',
      trendValue: '12%'
    };

    setDashboardState(prev => {
      const updatedPrescriptions = [...prev.mostPrescribed];
      
      // Only add if not already present
      if (!updatedPrescriptions.some(item => item.id === mockScannedMedicine.id)) {
        updatedPrescriptions.push(mockScannedMedicine);
        updatedPrescriptions.sort((a, b) => b.count - a.count);
      }
      
      return {
        ...prev,
        scannedData: mockScannedMedicine,
        showScanner: false,
        mostPrescribed: updatedPrescriptions.slice(0, 5)
      };
    });
  }, []);

  const toggleViewMode = useCallback((mode) => {
    setDashboardState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const toggleScanner = useCallback(() => {
    setDashboardState(prev => ({ ...prev, showScanner: !prev.showScanner }));
  }, []);

  const clearScannedData = useCallback(() => {
    setDashboardState(prev => ({ ...prev, scannedData: null }));
  }, []);

  // Pie chart renderer
  const renderPieChart = useCallback((size = 'large') => {
    const radius = size === 'large' ? { outer: 120, inner: 60 } : { outer: 80, inner: 40 };
    const colors = Object.values(CHART_CONFIG.colors);
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dashboardState.mostPrescribed}
            cx="50%"
            cy="50%"
            outerRadius={radius.outer}
            innerRadius={radius.inner}
            paddingAngle={2}
            dataKey="percentage"
            nameKey="name"
            label={({ name, percentage }) => `${name}\n${percentage}%`}
            labelLine={false}
          >
            {dashboardState.mostPrescribed.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {size === 'large' && (
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry, index) => (
                <span className="text-gray-600 text-sm">
                  {value} ({dashboardState.mostPrescribed[index].category})
                </span>
              )}
            />
          )}
          <Tooltip 
            formatter={(value, name, props) => [
              `${value}%`,
              `${props.payload.name} (${props.payload.category})`,
              size === 'large' ? `Total: ${props.payload.count.toLocaleString()} prescriptions` : null
            ].filter(Boolean)}
            contentStyle={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              padding: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }, [dashboardState.mostPrescribed]);

  // Component organization
  const StatCard = ({ stat }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${stat.color}`}>
          {stat.icon}
        </div>
        <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {stat.change}
        </span>
      </div>
      <h3 className="text-gray-500 text-sm mt-4">{stat.title}</h3>
      <p className="text-2xl font-bold mt-1">{stat.value}</p>
    </div>
  );

  const MedicineListItem = ({ medicine, index }) => {
    const colors = Object.values(CHART_CONFIG.colors);
    const color = colors[index % colors.length];
    
    return (
      <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-opacity-20" 
          style={{ backgroundColor: `${color}20` }}
        >
          <Pill className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{medicine.name}</h3>
          <p className="text-sm text-gray-500">{medicine.category}</p>
        </div>
        <div className="text-right ml-4">
          <p className="font-bold text-lg">{medicine.count.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{medicine.percentage}% of total</p>
        </div>
        <div className="ml-4 w-8 text-center">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            index === 0 ? 'bg-green-100 text-green-800' :
            index === 1 ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            #{index + 1}
          </span>
        </div>
      </div>
    );
  };

  const ScannerModal = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="h-40 bg-gray-200 mb-4 flex flex-col items-center justify-center rounded-lg">
        <QrCode className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-gray-500">Point your camera at a medicine QR code</p>
      </div>
      <div className="flex justify-center space-x-3">
        <button 
          onClick={handleScan}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Info className="h-4 w-4 mr-2" />
          Simulate Scan
        </button>
        <button 
          onClick={toggleScanner}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const ScannedDataCard = () => {
    if (!dashboardState.scannedData) return null;
    
    const { name, category, count, trend, trendValue } = dashboardState.scannedData;
    
    return (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Scanned Medicine</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{name}</p>
              </div>
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-medium">{category}</p>
              </div>
              <div>
                <p className="text-gray-500">Prescriptions</p>
                <p className="font-medium">{count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Trend</p>
                <p className={`font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendValue} {trend === 'up' ? '↑' : '↓'}
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={clearScannedData}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Most Prescribed Medicines Widget */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Most Prescribed Medicines</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleViewMode('list')}
                className={`p-2 rounded-md ${dashboardState.viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => toggleViewMode('chart')}
                className={`p-2 rounded-md ${dashboardState.viewMode === 'chart' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                aria-label="Chart view"
              >
                <PieChartIcon size={18} />
              </button>
              <button
                onClick={toggleScanner}
                className="flex items-center bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors"
              >
                <QrCode size={16} className="mr-2" />
                Scan
              </button>
            </div>
          </div>

          <ScannedDataCard />

          {dashboardState.showScanner && <ScannerModal />}

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List View */}
            {dashboardState.viewMode === 'list' && (
              <div className="lg:col-span-2">
                <div className="space-y-3">
                  {dashboardState.mostPrescribed.map((medicine, index) => (
                    <MedicineListItem key={medicine.id} medicine={medicine} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Chart View */}
            {dashboardState.viewMode === 'chart' && (
              <div className="lg:col-span-3">
                <div className="h-96">
                  {renderPieChart('large')}
                </div>
              </div>
            )}

            {/* Always show small chart in list view */}
            {dashboardState.viewMode === 'list' && (
              <div className="h-80">
                {renderPieChart('small')}
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing top {dashboardState.mostPrescribed.length} prescribed medicines. 
              <button className="text-blue-600 hover:text-blue-800 ml-2 font-medium">
                View full report →
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
"use client";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Pill, AlertTriangle, Calendar, Activity, Database, Search, Bell, ChevronDown } from "lucide-react";
import Layout from '@/components/Layout';

const Dashboard = () => {
  // Chart Data
  const usageData = [
    { name: 'Jan', usage: 4000, predicted: 3800 },
    { name: 'Feb', usage: 3000, predicted: 3200 },
    { name: 'Mar', usage: 2780, predicted: 2900 },
    { name: 'Apr', usage: 1890, predicted: 2100 },
    { name: 'May', usage: 2390, predicted: 2500 },
    { name: 'Jun', usage: 3490, predicted: 3300 },
  ];

  const inventoryData = [
    { name: 'Pain Relief', value: 400 },
    { name: 'Antibiotics', value: 300 },
    { name: 'Vitamins', value: 200 },
    { name: 'Antihistamines', value: 278 },
    { name: 'GI Drugs', value: 189 },
  ];

  // Stats Cards Data
  const stats = [
    { 
      title: "Total Inventory", 
      value: "5,284", 
      icon: <Database className="h-5 w-5" />,
      change: "+12%",
      trend: "up",
      color: "bg-blue-100 text-blue-600"
    },
    { 
      title: "Critical Alerts", 
      value: "24", 
      icon: <AlertTriangle className="h-5 w-5" />,
      change: "+3%",
      trend: "up",
      color: "bg-red-100 text-red-600"
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
  ];

  return (
    <Layout>
      {/* Dashboard Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm mt-4">{stat.title}</h3>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Medicine Usage Trend</h3>
              <select className="text-sm bg-gray-100 border-0 rounded-md px-3 py-2">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Inventory Breakdown</h3>
              <select className="text-sm bg-gray-100 border-0 rounded-md px-3 py-2">
                <option>By Category</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { id: 1, medicine: 'Amoxicillin', type: 'Low Stock', time: '2 hours ago', critical: true },
              { id: 2, medicine: 'Ibuprofen', type: 'Expiring Soon', time: '5 hours ago', critical: false },
              { id: 3, medicine: 'Paracetamol', type: 'High Demand', time: '1 day ago', critical: false },
              { id: 4, medicine: 'Omeprazole', type: 'Low Stock', time: '2 days ago', critical: true },
            ].map((alert) => (
              <div key={alert.id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-3 rounded-full mr-4 ${alert.critical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{alert.medicine}</h4>
                  <p className="text-sm text-gray-500">{alert.type}</p>
                </div>
                <span className="text-sm text-gray-400">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
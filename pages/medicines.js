import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaEdit, FaPlus, FaPrint, FaDownload, FaSearch, FaHistory, FaQrcode } from "react-icons/fa";
import Swal from 'sweetalert2';

const Medicines = () => {
  // State management
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newlyAdded, setNewlyAdded] = useState(new Set());
  
  // Format date to show month names (e.g., "April 15, 2023")
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form states
  const [newMedicine, setNewMedicine] = useState({
    drug_description: '',
    brand_name: '',
    lot_batch_no: '',
    expiry_date: '',
    physical_balance: ''
  });
  
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [editMedicine, setEditMedicine] = useState({
    drug_description: '',
    brand_name: '',
    lot_batch_no: '',
    expiry_date: '',
    physical_balance: ''
  });
  
  // Error states
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch medicines with error handling
  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/medicines?search=${searchQuery}`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      
      const data = await response.json();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load medicines',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [searchQuery]);

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle edit input changes with validation
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditMedicine(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when typing
    if (editErrors[name]) {
      setEditErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate medicine form
  const validateForm = (medicine, isEdit = false) => {
    const newErrors = {};
    
    if (!medicine.drug_description.trim()) {
      newErrors.drug_description = 'Drug description is required';
    }
    
    if (!medicine.brand_name.trim()) {
      newErrors.brand_name = 'Brand name is required';
    }
    
    if (!medicine.lot_batch_no.trim()) {
      newErrors.lot_batch_no = 'Batch number is required';
    }
    

    if (medicine.physical_balance === '' || isNaN(medicine.physical_balance)) {
      newErrors.physical_balance = 'Valid quantity is required';
    } else if (medicine.physical_balance < 0) {
      newErrors.physical_balance = 'Quantity cannot be negative';
    }
    
    if (isEdit) {
      setEditErrors(newErrors);
    } else {
      setErrors(newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Add new medicine
  const addMedicine = async () => {
    if (!validateForm(newMedicine)) return;
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedicine)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Duplicate medicine error
          Swal.fire({
            title: 'Duplicate Medicine',
            text: errorData.error || 'This medicine already exists',
            icon: 'warning',
            confirmButtonColor: '#3b82f6',
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to add medicine');
      }
      
      const addedMedicine = await response.json();
      
      setMedicines(prev => [...prev, addedMedicine].sort((a, b) => 
        a.drug_description.localeCompare(b.drug_description)
      ));
      
      setNewlyAdded(prev => new Set([...prev, addedMedicine.item_no]));
      setIsModalOpen(false);
      setNewMedicine({
        drug_description: '',
        brand_name: '',
        lot_batch_no: '',
        expiry_date: '',
        physical_balance: ''
      });
      
      Swal.fire({
        title: 'Success',
        text: 'Medicine added successfully',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
      });
    } catch (error) {
      console.error('Error adding medicine:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to add medicine',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit modal
  const openEditModal = (medicine) => {
    setSelectedMedicine(medicine);
    setEditMedicine({
      drug_description: medicine.drug_description,
      brand_name: medicine.brand_name,
      lot_batch_no: medicine.lot_batch_no,
      expiry_date: medicine.expiry_date.split('T')[0],
      physical_balance: medicine.physical_balance
    });
    setIsEditModalOpen(true);
  };

  // Save edited medicine
  const saveEditedMedicine = async () => {
    if (!validateForm(editMedicine, true)) return;
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/medicines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editMedicine,
          item_no: selectedMedicine.item_no
        })
      });
      
      if (!response.ok) throw new Error('Failed to update medicine');
      
      setMedicines(prev => 
        prev.map(med => 
          med.item_no === selectedMedicine.item_no ? 
          { ...med, ...editMedicine } : med
        )
      );
      
      setIsEditModalOpen(false);
      Swal.fire({
        title: 'Success',
        text: 'Medicine updated successfully',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
      });
    } catch (error) {
      console.error('Error updating medicine:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update medicine',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Archive medicine
  const archiveMedicine = async (itemNo) => {
    const result = await Swal.fire({
      title: 'Archive Medicine?',
      text: 'This will move the medicine to the archive',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, archive it!',
      backdrop: `
        rgba(0,0,0,0.5)
        url("/images/nyan-cat.gif")
        left top
        no-repeat
      `
    });
    
    if (result.isConfirmed) {
      try {
        setIsDeleting(true);
        const response = await fetch('/api/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: itemNo, 
            type: 'active',
            reason: 'Manually archived'
          })
        });
        
        if (!response.ok) throw new Error('Failed to archive medicine');
        
        setMedicines(prev => prev.filter(med => med.item_no !== itemNo));
        Swal.fire({
          title: 'Archived!',
          text: 'Medicine moved to archive',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
        });
      } catch (error) {
        console.error('Error archiving medicine:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to archive medicine',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Item No', 'Drug Description', 'Brand Name', 'Batch No', 'Expiry Date', 'Quantity'];
    const csvContent = [
      headers.join(','),
      ...medicines.map(med => [
        med.item_no,
        `"${med.drug_description.replace(/"/g, '""')}"`,
        `"${med.brand_name.replace(/"/g, '""')}"`,
        med.lot_batch_no,
        med.expiry_date.split('T')[0],
        med.physical_balance
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medicines_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 1000;

    return (
      <Layout>
        {/* Header with actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-white">Medicine Inventory</h1>
            <p className="text-sm text-white/90 mt-1">
              {medicines.length} {medicines.length === 1 ? 'item' : 'items'} in inventory
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-3 text-white/80" />
              <input
                type="text"
                placeholder="Search medicines..."
                className="w-full pl-10 pr-4 py-2 bg-white/20 text-white placeholder-white/70 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Action buttons - now icon-only with tooltips */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition hover:shadow-md"
                title="Add Medicine"
              >
                <FaPlus />
              </button>
              <button
                onClick={exportToCSV}
                className="p-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition hover:shadow-md"
                title="Export to CSV"
              >
                <FaDownload />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition hover:shadow-md print:hidden"
                title="Print"
              >
                <FaPrint />
              </button>
            </div>
          </div>
        </div>
  
        {/* Main content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicines.length > 0 ? (
                      medicines.map(medicine => (
                        <tr 
                          key={medicine.item_no} 
                          className={`hover:bg-gray-50 transition-colors ${
                            newlyAdded.has(medicine.item_no) ? 'bg-green-50 animate-pulse' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {medicine.item_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                            {medicine.drug_description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {medicine.brand_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {medicine.lot_batch_no}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            new Date(medicine.expiry_date) < new Date() ? 'text-red-600 font-bold' : 'text-gray-500'
                          }`}>
                            {formatDate(medicine.expiry_date)}
                            {new Date(medicine.expiry_date) < new Date() && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Expired</span>
                            )}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            medicine.physical_balance < LOW_STOCK_THRESHOLD ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            <span className="inline-block min-w-[50px]">
                              {medicine.physical_balance}
                            </span>
                            {medicine.physical_balance < LOW_STOCK_THRESHOLD && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Low Stock</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:hidden">
                            <div className="flex gap-3">
                              <button
                                onClick={() => openEditModal(medicine)}
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => archiveMedicine(medicine.item_no)}
                                className="text-red-600 hover:text-red-800 transition-colors p-1"
                                disabled={isDeleting}
                                title="Archive"
                              >
                                <FaTrash size={16} />
                              </button>
                              <button
                                className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                                title="Generate QR Code"
                              >
                                <FaQrcode size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {searchQuery ? 'No matching medicines found' : 'No medicines in inventory'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md">
                              {searchQuery ? 'Try adjusting your search query' : 'Click the "Add" button to add new medicines'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
  
        {/* Add Medicine Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Add New Medicine</h2>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'drug_description', label: 'Drug Description', type: 'text' },
                    { name: 'brand_name', label: 'Brand Name', type: 'text' },
                    { name: 'lot_batch_no', label: 'Batch Number', type: 'text' },
                    { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
                    { name: 'physical_balance', label: 'Quantity', type: 'number', min: 0 }
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={newMedicine[field.name]}
                        onChange={handleInputChange}
                        min={field.min}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors[field.name] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addMedicine}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Edit Medicine Modal */}
        {isEditModalOpen && selectedMedicine && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Edit Medicine</h2>
                  <button 
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'drug_description', label: 'Drug Description', type: 'text' },
                    { name: 'brand_name', label: 'Brand Name', type: 'text' },
                    { name: 'lot_batch_no', label: 'Batch Number', type: 'text' },
                    { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
                    { name: 'physical_balance', label: 'Quantity', type: 'number', min: 0 }
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={editMedicine[field.name]}
                        onChange={handleEditInputChange}
                        min={field.min}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          editErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {editErrors[field.name] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                          {editErrors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEditedMedicine}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  };

export default Medicines;
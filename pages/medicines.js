import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaEdit, FaPlus, FaDownload, FaPrint, FaSearch, FaQrcode } from "react-icons/fa";
import Swal from 'sweetalert2';

const Medicines = () => {
  // State management
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newlyAdded, setNewlyAdded] = useState(new Set());
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  // Sort medicines alphabetically by drug description
  const sortedMedicines = useMemo(() => {
    return [...medicines].sort((a, b) => 
      a.drug_description.localeCompare(b.drug_description)
    );
  }, [medicines]);

  // Fetch medicines
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
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [searchQuery]);

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditMedicine(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Form validation
  const validateForm = (medicine, isEdit = false) => {
    const newErrors = {};
    
    if (!medicine.drug_description.trim()) newErrors.drug_description = 'Required';
    if (!medicine.brand_name.trim()) newErrors.brand_name = 'Required';
    if (!medicine.lot_batch_no.trim()) newErrors.lot_batch_no = 'Required';
    if (!medicine.expiry_date) newErrors.expiry_date = 'Required';
    
    if (medicine.physical_balance === '' || isNaN(medicine.physical_balance)) {
      newErrors.physical_balance = 'Invalid quantity';
    } else if (medicine.physical_balance < 0) {
      newErrors.physical_balance = 'Cannot be negative';
    }
    
    if (isEdit) setEditErrors(newErrors);
    else setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  // CRUD operations
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
          Swal.fire({
            title: 'Duplicate Medicine',
            text: errorData.error || 'This medicine already exists',
            icon: 'warning',
            confirmButtonColor: '#4f46e5',
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to add medicine');
      }
      
      const addedMedicine = await response.json();
      setMedicines(prev => [...prev, addedMedicine]);
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
        confirmButtonColor: '#4f46e5',
      });
    } catch (error) {
      console.error('Error adding medicine:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to add medicine',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
        confirmButtonColor: '#4f46e5',
      });
    } catch (error) {
      console.error('Error updating medicine:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update medicine',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const archiveMedicine = async (itemNo) => {
    const result = await Swal.fire({
      title: 'Archive Medicine?',
      text: 'This will move the medicine to the archive',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, archive it',
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
          confirmButtonColor: '#4f46e5',
        });
      } catch (error) {
        console.error('Error archiving medicine:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to archive medicine',
          icon: 'error',
          confirmButtonColor: '#4f46e5',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Item No', 'Drug Description', 'Brand Name', 'Batch No', 'Expiry Date', 'Quantity'];
    const csvContent = [
      headers.join(','),
      ...sortedMedicines.map((med, index) => [
        index + 1, // Display sequential number instead of real ID
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

  const LOW_STOCK_THRESHOLD = 1000;

  return (
    <Layout>
      {/* Header Section */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Medicine Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">
              {medicines.length} {medicines.length === 1 ? 'item' : 'items'} in inventory
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search medicines..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              >
                <FaPlus className="mr-2 h-3 w-3" />
                Add Medicine
              </button>
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                  title="Export to CSV"
                >
                  <FaDownload className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition print:hidden"
                  title="Print"
                >
                  <FaPrint className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drug Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch No
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedMedicines.length > 0 ? (
                    sortedMedicines.map((medicine, index) => (
                      <tr 
                        key={medicine.item_no} 
                        className={`hover:bg-gray-50 ${newlyAdded.has(medicine.item_no) ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {medicine.drug_description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {medicine.brand_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {medicine.lot_batch_no}
                        </td>
                        <td className={`px-6 py-4 text-sm ${new Date(medicine.expiry_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          <div className="flex items-center">
                            {formatDate(medicine.expiry_date)}
                            {new Date(medicine.expiry_date) < new Date() && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${medicine.physical_balance < LOW_STOCK_THRESHOLD ? 'text-yellow-600' : 'text-gray-900'}`}>
                          <div className="flex items-center">
                            {medicine.physical_balance.toLocaleString()}
                            {medicine.physical_balance < LOW_STOCK_THRESHOLD && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => openEditModal(medicine)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => archiveMedicine(medicine.item_no)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isDeleting}
                              title="Archive"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                            <button
                              className="text-purple-600 hover:text-purple-900"
                              title="Generate QR Code"
                            >
                              <FaQrcode className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {searchQuery ? 'No matching medicines found' : 'No medicines in inventory'}
                          </h3>
                          <p className="text-sm text-gray-500 max-w-md">
                            {searchQuery ? 'Try adjusting your search query' : 'Click the "Add Medicine" button to add new medicines'}
                          </p>
                          {!searchQuery && (
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                            >
                              <FaPlus className="mr-2 h-3 w-3" />
                              Add Medicine
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Add New Medicine
                      </h3>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          setErrors({});
                        }}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 space-y-4">
                      {[
                        { name: 'drug_description', label: 'Drug Description', type: 'text' },
                        { name: 'brand_name', label: 'Brand Name', type: 'text' },
                        { name: 'lot_batch_no', label: 'Batch Number', type: 'text' },
                        { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
                        { name: 'physical_balance', label: 'Quantity', type: 'number', min: 0 }
                      ].map(field => (
                        <div key={field.name}>
                          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            id={field.name}
                            value={newMedicine[field.name]}
                            onChange={handleInputChange}
                            min={field.min}
                            className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${errors[field.name] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} border py-2 px-3`}
                          />
                          {errors[field.name] && (
                            <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={addMedicine}
                  disabled={isSaving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {isEditModalOpen && selectedMedicine && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Edit Medicine
                      </h3>
                      <button
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setEditErrors({});
                        }}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 space-y-4">
                      {[
                        { name: 'drug_description', label: 'Drug Description', type: 'text' },
                        { name: 'brand_name', label: 'Brand Name', type: 'text' },
                        { name: 'lot_batch_no', label: 'Batch Number', type: 'text' },
                        { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
                        { name: 'physical_balance', label: 'Quantity', type: 'number', min: 0 }
                      ].map(field => (
                        <div key={field.name}>
                          <label htmlFor={`edit-${field.name}`} className="block text-sm font-medium text-gray-700">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            id={`edit-${field.name}`}
                            value={editMedicine[field.name]}
                            onChange={handleEditInputChange}
                            min={field.min}
                            className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${editErrors[field.name] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} border py-2 px-3`}
                          />
                          {editErrors[field.name] && (
                            <p className="mt-1 text-sm text-red-600">{editErrors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={saveEditedMedicine}
                  disabled={isSaving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditErrors({});
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition"
                >
                  Cancel
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
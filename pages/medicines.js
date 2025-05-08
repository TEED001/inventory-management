import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaEdit, FaPlus, FaDownload, FaPrint, FaSearch, FaQrcode } from "react-icons/fa";
import Swal from 'sweetalert2';

// Constants
const LOW_STOCK_THRESHOLD = 1000;
const FORM_FIELDS = [
  { name: 'drug_description', label: 'Drug Description', type: 'text' },
  { name: 'brand_name', label: 'Brand Name', type: 'text' },
  { name: 'lot_batch_no', label: 'Batch Number', type: 'text' },
  { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
  { name: 'physical_balance', label: 'Quantity', type: 'number', min: 0 }
];
const TABLE_COLUMNS = [
  { id: 'index', label: '#', className: 'font-medium text-gray-900' },
  { id: 'drug_description', label: 'Drug Description', className: 'text-gray-600 font-medium' },
  { id: 'brand_name', label: 'Brand', className: 'text-gray-500' },
  { id: 'lot_batch_no', label: 'Batch No', className: 'text-gray-500' },
  { id: 'expiry_date', label: 'Expiry Date', className: 'text-gray-500' },
  { id: 'physical_balance', label: 'Quantity', className: 'font-medium text-gray-900' }
];

const Medicines = () => {
  // State management
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newlyAdded, setNewlyAdded] = useState(new Set());
  const [qrModalData, setQrModalData] = useState(null);
  
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

  // Format date
  const formatDate = useCallback((dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Sort medicines alphabetically by drug description
  const sortedMedicines = useMemo(() => {
    return [...medicines].sort((a, b) => 
      a.drug_description.localeCompare(b.drug_description)
    );
  }, [medicines]);

  // Fetch medicines
  const fetchMedicines = useCallback(async () => {
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
  }, [searchQuery]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Generate QR Code URL
  const generateQRCodeUrl = useCallback((medicine) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `Medicine: ${medicine.drug_description}\nBrand: ${medicine.brand_name}\nBatch: ${medicine.lot_batch_no}\nExpiry: ${formatDate(medicine.expiry_date)}`
    )}`;
  }, [formatDate]);

  // Open QR Code Modal
  const openQRModal = useCallback((medicine) => {
    setQrModalData({
      medicine,
      qrUrl: generateQRCodeUrl(medicine)
    });
  }, [generateQRCodeUrl]);

  // Print QR Code
  const printQRCode = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .qr-container { text-align: center; padding: 20px; }
            .qr-info { margin-top: 20px; font-family: Arial, sans-serif; font-size: 16px; }
            .qr-info p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrModalData.qrUrl}" alt="QR Code" />
            <div class="qr-info">
              <p><strong>Medicine:</strong> ${qrModalData.medicine.drug_description}</p>
              <p><strong>Brand:</strong> ${qrModalData.medicine.brand_name}</p>
              <p><strong>Batch:</strong> ${qrModalData.medicine.lot_batch_no}</p>
              <p><strong>Expiry:</strong> ${formatDate(qrModalData.medicine.expiry_date)}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [qrModalData, formatDate]);

  // Input handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewMedicine(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }, [errors]);

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditMedicine(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: undefined }));
  }, [editErrors]);

  // Form validation
  const validateForm = useCallback((medicine, isEdit = false) => {
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
  }, []);

  // CRUD operations
  const addMedicine = useCallback(async () => {
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
  }, [newMedicine, validateForm]);

  const openEditModal = useCallback((medicine) => {
    setSelectedMedicine(medicine);
    setEditMedicine({
      drug_description: medicine.drug_description,
      brand_name: medicine.brand_name,
      lot_batch_no: medicine.lot_batch_no,
      expiry_date: medicine.expiry_date.split('T')[0],
      physical_balance: medicine.physical_balance
    });
    setIsEditModalOpen(true);
  }, []);

  const saveEditedMedicine = useCallback(async () => {
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
  }, [editMedicine, selectedMedicine, validateForm]);

  const archiveMedicine = useCallback(async (itemNo) => {
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
  }, []);

  const exportToCSV = useCallback(() => {
    const headers = ['Item No', 'Drug Description', 'Brand Name', 'Batch No', 'Expiry Date', 'Quantity'];
    const csvContent = [
      headers.join(','),
      ...sortedMedicines.map((med, index) => [
        index + 1,
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
  }, [sortedMedicines]);

  // Render functions
  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {TABLE_COLUMNS.map(column => (
          <th 
            key={column.id}
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {column.label}
          </th>
        ))}
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
          Actions
        </th>
      </tr>
    </thead>
  );

  const renderTableRow = (medicine, index) => {
    const isExpired = new Date(medicine.expiry_date) < new Date();
    const isLowStock = medicine.physical_balance < LOW_STOCK_THRESHOLD;
    
    return (
      <tr 
        key={medicine.item_no} 
        className={`hover:bg-gray-50 ${newlyAdded.has(medicine.item_no) ? 'bg-green-50' : ''}`}
      >
        {TABLE_COLUMNS.map(column => (
          <td key={`${medicine.item_no}-${column.id}`} className={`px-6 py-4 whitespace-nowrap text-sm ${column.className}`}>
            {column.id === 'index' ? index + 1 : 
             column.id === 'expiry_date' ? (
              <div className="flex items-center">
                {formatDate(medicine.expiry_date)}
                {isExpired && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Expired
                  </span>
                )}
              </div>
             ) : column.id === 'physical_balance' ? (
              <div className="flex items-center">
                {medicine.physical_balance.toLocaleString()}
                {isLowStock && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Low Stock
                  </span>
                )}
              </div>
             ) : medicine[column.id]}
          </td>
        ))}
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
              onClick={() => openQRModal(medicine)}
              className="text-purple-600 hover:text-purple-900"
              title="Generate QR Code"
            >
              <FaQrcode className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderEmptyState = () => (
    <tr>
      <td colSpan={TABLE_COLUMNS.length + 1} className="px-6 py-12 text-center">
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
  );

  const renderModalForm = (isEdit = false) => {
    const currentForm = isEdit ? editMedicine : newMedicine;
    const currentErrors = isEdit ? editErrors : errors;
    const currentHandler = isEdit ? handleEditInputChange : handleInputChange;
    const submitHandler = isEdit ? saveEditedMedicine : addMedicine;
    const title = isEdit ? 'Edit Medicine' : 'Add New Medicine';
    const closeHandler = () => {
      if (isEdit) {
        setIsEditModalOpen(false);
        setEditErrors({});
      } else {
        setIsModalOpen(false);
        setErrors({});
      }
    };

    return (
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
                      {title}
                    </h3>
                    <button
                      onClick={closeHandler}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {FORM_FIELDS.map(field => (
                      <div key={field.name}>
                        <label htmlFor={`${isEdit ? 'edit-' : ''}${field.name}`} className="block text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          name={field.name}
                          id={`${isEdit ? 'edit-' : ''}${field.name}`}
                          value={currentForm[field.name]}
                          onChange={currentHandler}
                          min={field.min}
                          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${currentErrors[field.name] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} border py-2 px-3`}
                        />
                        {currentErrors[field.name] && (
                          <p className="mt-1 text-sm text-red-600">{currentErrors[field.name]}</p>
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
                onClick={submitHandler}
                disabled={isSaving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? 'Saving...' : 'Saving'}
                  </>
                ) : isEdit ? 'Save Changes' : 'Save'}
              </button>
              <button
                type="button"
                onClick={closeHandler}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQRModal = () => (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Medicine QR Code
                  </h3>
                  <button
                    onClick={() => setQrModalData(null)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <img 
                    src={qrModalData.qrUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 border border-gray-200 rounded-lg"
                  />
                  <div className="mt-4 text-left w-full">
                    <p className="text-sm text-gray-500"><strong>Medicine:</strong> {qrModalData.medicine.drug_description}</p>
                    <p className="text-sm text-gray-500"><strong>Brand:</strong> {qrModalData.medicine.brand_name}</p>
                    <p className="text-sm text-gray-500"><strong>Batch:</strong> {qrModalData.medicine.lot_batch_no}</p>
                    <p className="text-sm text-gray-500"><strong>Expiry:</strong> {formatDate(qrModalData.medicine.expiry_date)}</p>
                  </div>
                  <button
                    onClick={printQRCode}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                  >
                    <FaPrint className="mr-2 h-4 w-4" />
                    Print QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Header Section */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
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
                {renderTableHeader()}
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedMedicines.length > 0 ? 
                    sortedMedicines.map(renderTableRow) : 
                    renderEmptyState()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {isModalOpen && renderModalForm()}

      {/* Edit Medicine Modal */}
      {isEditModalOpen && selectedMedicine && renderModalForm(true)}

      {/* QR Code Modal */}
      {qrModalData && renderQRModal()}
    </Layout>
  );
};

export default Medicines;
import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaSearch, FaEdit, FaTimes, FaQrcode, FaArchive, FaRedo, FaDownload, FaPrint } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';

// Constants for reusable values
const TABLE_COLUMNS = [
  { id: 'index', label: '#', className: 'font-medium text-gray-900' },
  { id: 'drug_description', label: 'Drug Description', className: 'font-medium text-gray-600' },
  { id: 'brand_name', label: 'Brand', className: 'text-gray-500' },
  { id: 'lot_batch_no', label: 'Batch No', className: 'text-gray-500' },
  { id: 'expiry_date', label: 'Expiry Date', className: 'font-medium text-red-600' },
  { id: 'physical_balance', label: 'Qty', className: 'text-gray-500' },
  { id: 'status', label: 'Status', className: '' },
];

const FORM_FIELDS = [
  { name: 'drug_description', label: 'Drug Description', type: 'text' },
  { name: 'brand_name', label: 'Brand Name', type: 'text' },
  { name: 'lot_batch_no', label: 'Batch Number', type: 'text' },
  { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
  { name: 'physical_balance', label: 'Quantity', type: 'number', min: 0 }
];

const ExpiredMedicines = () => {
    const [expiredMeds, setExpiredMeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentMedicine, setCurrentMedicine] = useState(null);
    const [formData, setFormData] = useState({
        drug_description: '',
        brand_name: '',
        lot_batch_no: '',
        expiry_date: '',
        physical_balance: '',
        reason: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });
    const [qrModalData, setQrModalData] = useState(null);
    const router = useRouter();

    // Sort medicines alphabetically by drug description
    const sortedMedicines = useMemo(() => {
        return [...expiredMeds].sort((a, b) => 
            a.drug_description.localeCompare(b.drug_description)
        );
    }, [expiredMeds]);

    const fetchExpiredMedicines = useCallback(async (page = 1, limit = 10, search = '') => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/expired-medicines?page=${page}&limit=${limit}&search=${search}&sort=drug_description&order=asc`
            );
            const { data, pagination: paginationData } = await response.json();
            setExpiredMeds(data || []);
            setPagination(paginationData || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 1
            });
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to load expired medicines',
                icon: 'error',
                confirmButtonColor: '#4f46e5',
            });
            setExpiredMeds([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpiredMedicines(
            pagination.page, 
            pagination.limit, 
            searchQuery
        );
    }, [pagination.page, pagination.limit, searchQuery, fetchExpiredMedicines]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    }, [pagination.totalPages]);

    const handleDelete = useCallback(async (id) => {
        const result = await Swal.fire({
            title: 'Archive Record?',
            text: "This will archive this expired medicine record!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });
    
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/expired-medicines?id=${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    setExpiredMeds(prev => prev.filter(med => med.id !== id));
                    Swal.fire({
                        title: 'Archived!',
                        text: 'Record has been archived successfully.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchExpiredMedicines();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to archive record');
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: '#4f46e5',
                });
            }
        }
    }, [fetchExpiredMedicines]);

    const openEditModal = useCallback((medicine) => {
        setCurrentMedicine(medicine);
        setFormData({
            drug_description: medicine.drug_description,
            brand_name: medicine.brand_name,
            lot_batch_no: medicine.lot_batch_no,
            expiry_date: medicine.expiry_date.split('T')[0],
            physical_balance: medicine.physical_balance,
            reason: medicine.reason || ''
        });
        setEditModalOpen(true);
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/expired-medicines`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: currentMedicine.id,
                    ...formData
                })
            });

            if (response.ok) {
                const { message } = await response.json();
                setEditModalOpen(false);
                Swal.fire({
                    title: 'Success!',
                    text: message || 'Medicine updated successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchExpiredMedicines();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update medicine');
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#4f46e5',
            });
        }
    }, [currentMedicine, formData, fetchExpiredMedicines]);

    const formatDate = useCallback((dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }, []);

    const exportToCSV = useCallback(() => {
        const headers = ['#', 'Drug Description', 'Brand Name', 'Batch No', 'Expiry Date', 'Quantity', 'Status'];
        const csvContent = [
            headers.join(','),
            ...sortedMedicines.map((med, index) => [
                index + 1,
                `"${med.drug_description.replace(/"/g, '""')}"`,
                `"${med.brand_name.replace(/"/g, '""')}"`,
                med.lot_batch_no,
                med.expiry_date.split('T')[0],
                med.physical_balance,
                med.is_archived ? 'Archived' : 'Expired'
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `expired_medicines_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [sortedMedicines]);

    const generateQRCodeUrl = useCallback((medicine) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            `Medicine: ${medicine.drug_description}\nBrand: ${medicine.brand_name}\nBatch: ${medicine.lot_batch_no}\nExpiry: ${formatDate(medicine.expiry_date)}`
        )}`;
    }, [formatDate]);

    const openQRModal = useCallback((medicine) => {
        setQrModalData({
            medicine,
            qrUrl: generateQRCodeUrl(medicine)
        });
    }, [generateQRCodeUrl]);

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

    const renderTableRow = (med, index) => (
        <tr key={med.id} className="hover:bg-gray-50">
            {TABLE_COLUMNS.map(column => (
                <td key={`${med.id}-${column.id}`} className={`px-6 py-4 whitespace-nowrap text-sm ${column.className}`}>
                    {column.id === 'index' ? (pagination.page - 1) * pagination.limit + index + 1 : 
                     column.id === 'expiry_date' ? formatDate(med.expiry_date) :
                     column.id === 'physical_balance' ? med.physical_balance.toLocaleString() :
                     column.id === 'status' ? (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${med.is_archived ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                            {med.is_archived ? 'Archived' : 'Expired'}
                        </span>
                     ) : med[column.id]}
                </td>
            ))}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => openEditModal(med)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit record"
                    >
                        <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(med.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Archive record"
                    >
                        <FaArchive className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => openQRModal(med)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Generate QR Code"
                    >
                        <FaQrcode className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );

    const renderEmptyState = () => (
        <tr>
            <td colSpan={TABLE_COLUMNS.length + 1} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {searchQuery ? 'No matching expired medicines found' : 'No expired medicines in inventory'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                        {searchQuery ? 'Try adjusting your search query' : 'All medicines are currently within their expiry dates'}
                    </p>
                </div>
            </td>
        </tr>
    );

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;
        
        const renderPageNumbers = () => {
            const pages = [];
            const maxVisiblePages = 5;
            let startPage, endPage;
            
            if (pagination.totalPages <= maxVisiblePages) {
                startPage = 1;
                endPage = pagination.totalPages;
            } else if (pagination.page <= Math.ceil(maxVisiblePages / 2)) {
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (pagination.page + Math.floor(maxVisiblePages / 2) >= pagination.totalPages) {
                startPage = pagination.totalPages - maxVisiblePages + 1;
                endPage = pagination.totalPages;
            } else {
                startPage = pagination.page - Math.floor(maxVisiblePages / 2);
                endPage = pagination.page + Math.floor(maxVisiblePages / 2);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === i
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {i}
                    </button>
                );
            }
            
            return pages;
        };

        return (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div></div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">First</span>
                                «
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Previous</span>
                                ‹
                            </button>
                            
                            {renderPageNumbers()}
                            
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Next</span>
                                ›
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.page === pagination.totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Last</span>
                                »
                            </button>
                        </nav>
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
                            {pagination.total} {pagination.total === 1 ? 'record' : 'records'} found
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
                                placeholder="Search expired medicines..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
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

                        {/* Pagination */}
                        {renderPagination()}
                    </div>
                )}
            </div>

            {/* Edit Medicine Modal */}
            {editModalOpen && (
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
                                                Edit Expired Medicine
                                            </h3>
                                            <button
                                                onClick={() => setEditModalOpen(false)}
                                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                            >
                                                <span className="sr-only">Close</span>
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                            {FORM_FIELDS.map(field => (
                                                <div key={field.name}>
                                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.type}
                                                        name={field.name}
                                                        id={field.name}
                                                        value={formData[field.name]}
                                                        onChange={handleInputChange}
                                                        min={field.min}
                                                        className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 border py-2 px-3"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrModalData && renderQRModal()}
        </Layout>
    );
};

export default ExpiredMedicines;
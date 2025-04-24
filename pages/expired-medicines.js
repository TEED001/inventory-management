import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaSearch, FaEdit, FaTimes, FaQrcode, FaArchive, FaRedo, FaDownload, FaPrint } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';

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
    const router = useRouter();

    // Sort medicines alphabetically by drug description
    const sortedMedicines = useMemo(() => {
        return [...expiredMeds].sort((a, b) => 
            a.drug_description.localeCompare(b.drug_description)
        );
    }, [expiredMeds]);

    const fetchExpiredMedicines = async (page = 1, limit = 10, search = '') => {
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
            setIsLoading(false);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to load expired medicines',
                icon: 'error',
                confirmButtonColor: '#4f46e5',
            });
            setExpiredMeds([]);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiredMedicines(
            pagination.page, 
            pagination.limit, 
            searchQuery
        );
    }, [pagination.page, pagination.limit, searchQuery]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleDelete = async (id) => {
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
                    setExpiredMeds(expiredMeds.filter(med => med.id !== id));
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
                    Swal.fire({
                        title: 'Error',
                        text: error.error || 'Failed to archive record',
                        icon: 'error',
                        confirmButtonColor: '#4f46e5',
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to archive record',
                    icon: 'error',
                    confirmButtonColor: '#4f46e5',
                });
            }
        }
    };



    const openEditModal = (medicine) => {
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
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
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
                Swal.fire({
                    title: 'Error',
                    text: error.error || 'Failed to update medicine',
                    icon: 'error',
                    confirmButtonColor: '#4f46e5',
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update medicine',
                icon: 'error',
                confirmButtonColor: '#4f46e5',
            });
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const exportToCSV = () => {
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
    };

    return (
        <Layout>
            {/* Header Section */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Expired Medicines</h1>
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
                                            Qty
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedMedicines.length > 0 ? (
                                        sortedMedicines.map((med, index) => (
                                            <tr key={med.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                    {med.drug_description}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {med.brand_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {med.lot_batch_no}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-red-600 font-medium">
                                                    {formatDate(med.expiry_date)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {med.physical_balance.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${med.is_archived ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                                        {med.is_archived ? 'Archived' : 'Expired'}
                                                    </span>
                                                </td>
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
                                                            onClick={() => {
                                                                Swal.fire({
                                                                    title: 'QR Code',
                                                                    text: 'QR code functionality would be implemented here',
                                                                    imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + 
                                                                            encodeURIComponent(`Medicine: ${med.drug_description}\nBrand: ${med.brand_name}\nBatch: ${med.lot_batch_no}\nExpiry: ${med.expiry_date}`),
                                                                    imageAlt: 'QR Code',
                                                                    showConfirmButton: true
                                                                });
                                                            }}
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
                                            <td colSpan="8" className="px-6 py-12 text-center">
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
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
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
                                    <div>
                                    </div>
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
                                            
                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.page >= pagination.totalPages - 2) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = pagination.page - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            pagination.page === pageNum
                                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            
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
                        )}
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
        </Layout>
    );
};

export default ExpiredMedicines;
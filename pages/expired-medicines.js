import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaSearch, FaEdit, FaTimes, FaQrcode, FaArchive, FaRedo } from 'react-icons/fa';
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
    const [sortConfig, setSortConfig] = useState({
        key: 'expiry_date',
        direction: 'desc'
    });
    const router = useRouter();

    const fetchExpiredMedicines = async (page = 1, limit = 10, search = '', sort = 'expiry_date', order = 'desc') => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/expired-medicines?page=${page}&limit=${limit}&search=${search}&sort=${sort}&order=${order}`
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
            Swal.fire('Error', 'Failed to load expired medicines', 'error');
            setExpiredMeds([]);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiredMedicines(
            pagination.page, 
            pagination.limit, 
            searchQuery, 
            sortConfig.key, 
            sortConfig.direction
        );
    }, [pagination.page, pagination.limit, searchQuery, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
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
                    fetchExpiredMedicines(); // Refresh data
                } else {
                    const error = await response.json();
                    Swal.fire('Error', error.error || 'Failed to archive record', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to archive record', 'error');
            }
        }
    };

    const handleRestore = async (id) => {
        const result = await Swal.fire({
            title: 'Restore Medicine?',
            text: "This will move the medicine back to active inventory if its expiry date is in the future.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Restore',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });
    
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/expired-medicines`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id,
                        archive: false
                    })
                });
                
                if (response.ok) {
                    Swal.fire({
                        title: 'Restored!',
                        text: 'Medicine has been moved back to active inventory.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchExpiredMedicines(); // Refresh data
                } else {
                    const error = await response.json();
                    Swal.fire('Error', error.error || 'Failed to restore medicine', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to restore medicine', 'error');
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
                fetchExpiredMedicines(); // Refresh data
            } else {
                const error = await response.json();
                Swal.fire('Error', error.error || 'Failed to update medicine', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update medicine', 'error');
        }
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Expired Medicines</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {pagination.total} records found • Page {pagination.page} of {pagination.totalPages}
                        </p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by drug, brand, or batch..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 w-full transition-all duration-300"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-red-50 to-red-100">
                                    <tr>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors"
                                            onClick={() => handleSort('drug_description')}
                                        >
                                            <div className="flex items-center">
                                                Drug Description {getSortIcon('drug_description')}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors"
                                            onClick={() => handleSort('brand_name')}
                                        >
                                            <div className="flex items-center">
                                                Brand {getSortIcon('brand_name')}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors"
                                            onClick={() => handleSort('lot_batch_no')}
                                        >
                                            <div className="flex items-center">
                                                Batch No. {getSortIcon('lot_batch_no')}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors"
                                            onClick={() => handleSort('expiry_date')}
                                        >
                                            <div className="flex items-center">
                                                Expiry Date {getSortIcon('expiry_date')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {expiredMeds.map((med) => (
                                        <tr key={med.id} className="hover:bg-red-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{med.drug_description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.brand_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.lot_batch_no}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(med.expiry_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {med.physical_balance}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${med.is_archived ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                                    {med.is_archived ? 'Archived' : 'Expired'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                                <button
                                                    onClick={() => openEditModal(med)}
                                                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Edit record"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(med.id)}
                                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Archive record"
                                                >
                                                    <FaArchive />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // QR Code functionality placeholder
                                                        Swal.fire({
                                                            title: 'QR Code',
                                                            text: 'QR code functionality would be implemented here',
                                                            imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + 
                                                                    encodeURIComponent(`Medicine: ${med.drug_description}\nBrand: ${med.brand_name}\nBatch: ${med.lot_batch_no}\nExpiry: ${med.expiry_date}`),
                                                            imageAlt: 'QR Code',
                                                            showConfirmButton: true
                                                        });
                                                    }}
                                                    className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-full transition-colors"
                                                    title="Generate QR Code"
                                                >
                                                    <FaQrcode />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {expiredMeds.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                {searchQuery ? 'No matching expired medicines found' : 'No expired medicines in inventory'}
                            </div>
                        )}

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
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                                            </span>{' '}
                                            of <span className="font-medium">{pagination.total}</span> results
                                        </p>
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
                                                                ? 'z-10 bg-red-50 border-red-500 text-red-600'
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
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div 
      className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Medicine</h2>
          <button 
            onClick={() => setEditModalOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                value={formData[field.name]}
                onChange={handleInputChange}
                min={field.min}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition border-gray-300"
                required
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition border-gray-300"
              rows="3"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

        </Layout>
    );
};

export default ExpiredMedicines;
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaUndo, FaSearch, FaArchive, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Archive = () => {
  const [archivedItems, setArchivedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [sortConfig, setSortConfig] = useState({
    column: 'drug_description', // Default to alphabetical by drug description
    direction: 'ASC' // Default to ascending
  });

  const fetchArchivedItems = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/archive?page=${page}&limit=${pagination.limit}&type=${
          activeTab === 'all' ? '' : activeTab
        }&search=${searchQuery}&sort=${sortConfig.column}&order=${sortConfig.direction}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const { data, pagination: paginationData } = await response.json();
      
      setArchivedItems(data || []);
      setPagination(paginationData || {
        page,
        limit: pagination.limit,
        total: 0,
        totalPages: 1
      });
      
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load archived items',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
      });
      setArchivedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedItems();
  }, [activeTab, searchQuery, sortConfig]);

  const handleRestore = async (id, type) => {
    const result = await Swal.fire({
      title: 'Restore Item?',
      text: `This will restore this ${type} medicine back to ${type === 'active' ? 'active inventory' : 'expired list'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, restore it',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/archive', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id, 
            restoreTo: type,
            restored_by: 'User Name'
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to restore item');
        }
        
        await fetchArchivedItems(pagination.page);
        Swal.fire({
          title: 'Restored!',
          text: data.message || 'Item restored successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Restore error:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to restore item',
          icon: 'error',
          confirmButtonColor: '#4f46e5',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Permanently?',
      text: "This will permanently remove this record from the archive!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4f46e5',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/archive?id=${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete record');
        }
        
        await fetchArchivedItems(pagination.page);
        Swal.fire({
          title: 'Deleted!',
          text: 'Record has been permanently deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to delete record',
          icon: 'error',
          confirmButtonColor: '#4f46e5',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchArchivedItems(newPage);
    }
  };

  const handleSort = (column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'DESC' ? 'ASC' : 'DESC'
    }));
  };

  const getSortIndicator = (column) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'ASC' ? '↑' : '↓';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Archived Medicines</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total} records found
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search archive..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {['all', 'active', 'expired'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === tab 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className={`ml-1 text-xs px-2 py-1 rounded-full ${
                  activeTab === tab ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {archivedItems.filter(i => i.type === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Table - Responsive with horizontal scroll on small screens */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">
                          Type {getSortIndicator('type')}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('drug_description')}
                      >
                        <div className="flex items-center">
                          Drug Description {getSortIndicator('drug_description')}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('brand_name')}
                      >
                        <div className="flex items-center">
                          Brand {getSortIndicator('brand_name')}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Batch No.
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('expiry_date')}
                      >
                        <div className="flex items-center">
                          Expiry Date {getSortIndicator('expiry_date')}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Qty
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('archived_at')}
                      >
                        <div className="flex items-center">
                          Archived On {getSortIndicator('archived_at')}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {archivedItems.map((item) => (
                      <tr key={`${item.id}-${item.type}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.type === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type === 'active' ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.drug_description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.brand_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.lot_batch_no}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(item.expiry_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.physical_balance}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>{formatDate(item.archived_at)}</span>
                            <span className="text-xs text-gray-400">
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleRestore(item.id, item.type)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title={`Restore to ${item.type === 'active' ? 'active' : 'expired'}`}
                              disabled={isLoading}
                            >
                              <FaUndo className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete permanently"
                              disabled={isLoading}
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {archivedItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                    <FaArchive className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchQuery ? 'No matching items found' : 'Archive is empty'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search to find what you\'re looking for.' 
                      : 'Items archived from active or expired lists will appear here.'}
                  </p>
                </div>
              )}
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default Archive;
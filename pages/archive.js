import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaUndo, FaSearch, FaArchive } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Archive = () => {
  const [archivedItems, setArchivedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'expired'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  const fetchArchivedItems = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/archive?page=${page}&limit=${pagination.limit}&type=${
          activeTab === 'all' ? '' : activeTab
        }&search=${searchQuery}`
      );
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
      Swal.fire('Error', 'Failed to load archived items', 'error');
      setArchivedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedItems();
  }, [activeTab, searchQuery]);

  const handleRestore = async (id, type) => {
    const result = await Swal.fire({
      title: 'Restore Item?',
      text: `This will restore this ${type} medicine back to ${type === 'active' ? 'active inventory' : 'expired list'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/archive', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id, 
            restoreTo: type,
            restored_by: 'User Name' // Replace with actual user from your auth system
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          await fetchArchivedItems(pagination.page);
          Swal.fire('Restored!', data.message || 'Item restored successfully', 'success');
        } else {
          throw new Error(data.error || 'Failed to restore item');
        }
      } catch (error) {
        console.error('Restore error:', error);
        Swal.fire('Error', error.message || 'Failed to restore item', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Permanently?',
      text: "This will permanently remove this record from the archive!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/archive?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchArchivedItems(pagination.page);
          Swal.fire('Deleted!', 'Record has been permanently deleted.', 'success');
        } else {
          throw new Error('Failed to delete record');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire('Error', error.message || 'Failed to delete record', 'error');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchArchivedItems(newPage);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Archived Medicines</h1>
          
          <div className="relative w-full md:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search archive..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {['all', 'active', 'expired'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium text-sm ${activeTab === tab ? 
                'text-blue-600 border-b-2 border-blue-600' : 
                'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className="ml-1 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {archivedItems.filter(i => i.type === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading archived items...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {archivedItems.map((item) => (
                      <tr key={`${item.id}-${item.type}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.type === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type === 'active' ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.drug_description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.brand_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.lot_batch_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.physical_balance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(item.archived_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {item.archived_by || 'System'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleRestore(item.id, item.type)}
                            className="text-blue-600 hover:text-blue-900 flex items-center text-sm"
                            title={`Restore to ${item.type === 'active' ? 'active' : 'expired'}`}
                          >
                            <FaUndo className="mr-1" /> Restore
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 flex items-center text-sm"
                            title="Delete permanently"
                          >
                            <FaTrash className="mr-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {archivedItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery 
                    ? 'No archived items match your search criteria' 
                    : 'No items found in archive'}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
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
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        &larr; Previous
                      </button>
                      
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
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
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
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.page === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        Next &rarr;
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
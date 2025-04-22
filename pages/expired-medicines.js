import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaSearch, FaEdit, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

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
        physical_balance: ''
    });

    const fetchExpiredMedicines = async () => {
        try {
            const response = await fetch('/api/expired-medicines');
            const { data } = await response.json();
            setExpiredMeds(data || []);
            setIsLoading(false);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Failed to load expired medicines', 'error');
            setExpiredMeds([]);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiredMedicines();
    }, []);

    const filteredMeds = expiredMeds.filter(med => 
        med.drug_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.lot_batch_no?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Archive Record?',
            text: "This will archive this expired medicine record!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Archive'
        });
    
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/expired-medicines?id=${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    setExpiredMeds(expiredMeds.filter(med => med.id !== id));
                    Swal.fire('Archived!', 'Record has been archived successfully.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to archive record', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to archive record', 'error');
            }
        }
    };

    const openEditModal = (medicine) => {
        setCurrentMedicine(medicine);
        setFormData({
            drug_description: medicine.drug_description,
            brand_name: medicine.brand_name,
            lot_batch_no: medicine.lot_batch_no,
            expiry_date: medicine.expiry_date.split('T')[0], // Format date for input
            physical_balance: medicine.physical_balance
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
                const updatedMed = await response.json();
                setExpiredMeds(expiredMeds.map(med => 
                    med.id === currentMedicine.id ? { ...med, ...updatedMed.data } : med
                ));
                setEditModalOpen(false);
                Swal.fire('Success', 'Medicine updated successfully', 'success');
            } else {
                const error = await response.json();
                Swal.fire('Error', error.error || 'Failed to update medicine', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update medicine', 'error');
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Expired Medicines</h1>
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by drug, brand, or batch..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-red-50 to-red-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Drug Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Brand</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Batch No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Expiry Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMeds.map((med) => (
                                        <tr key={med.id} className="hover:bg-red-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{med.drug_description}</td>
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
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Expired
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                                <button
                                                    onClick={() => openEditModal(med)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="Edit record"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(med.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Archive record"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredMeds.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                {searchQuery ? 'No matching expired medicines found' : 'No expired medicines in inventory'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center border-b px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-800">Edit Medicine</h3>
                            <button 
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Drug Description</label>
                                <input
                                    type="text"
                                    name="drug_description"
                                    value={formData.drug_description}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    name="brand_name"
                                    value={formData.brand_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    name="lot_batch_no"
                                    value={formData.lot_batch_no}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    name="physical_balance"
                                    value={formData.physical_balance}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ExpiredMedicines;
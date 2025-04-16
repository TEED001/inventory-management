import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaSearch, FaHistory } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ExpiredMedicines = () => {
    const [expiredMeds, setExpiredMeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchExpiredMedicines = async () => {
        try {
            const response = await fetch('/api/expired-medicines');
            const data = await response.json();
            setExpiredMeds(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Failed to load expired medicines', 'error');
        }
    };

    useEffect(() => {
        fetchExpiredMedicines();
    }, []);

    const filteredMeds = expiredMeds.filter(med => 
        med.drug_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.lot_batch_no.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Record?',
            text: "This will permanently remove this expired medicine record!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Delete'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/expired-medicines?id=${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    setExpiredMeds(expiredMeds.filter(med => med.id !== id));
                    Swal.fire('Deleted!', 'Record has been deleted.', 'success');
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to delete record', 'error');
            }
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        <FaHistory className="inline mr-2 text-red-500" />
                        Expired Medicines
                    </h1>
                    
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search expired medicines..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-red-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Drug Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Brand</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Batch No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Expiry Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMeds.map((med) => (
                                    <tr key={med.id} className="hover:bg-red-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{med.drug_description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{med.brand_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{med.lot_batch_no}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(med.expiry_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                {med.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleDelete(med.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredMeds.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No expired medicines found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ExpiredMedicines;
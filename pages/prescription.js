import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaTrash, FaSearch, FaEdit, FaPrint, FaEye, FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';

const PrescriptionList = () => {
  // State
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialFormData = {
    patientName: '',
    address: '',
    hospitalNo: '',
    date: new Date().toISOString().split('T')[0],
    age: '',
    sex: 'Male',
    medicines: [{ name: '', quantity: '' }],
    prNo: 'N/A',
    ucNo: 'N/A',
    ptrNo: 'N/A'
  };
  
  const [formData, setFormData] = useState(initialFormData);

  // Fetch prescriptions
  useEffect(() => {
    const fetchPrescriptions = async () => {
      setIsLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockData = [
          {
            id: 1,
            patientName: 'Milo G. ODZ',
            address: 'Balingasag Mis. Or.',
            hospitalNo: 'H305',
            date: '2003-10-12',
            age: '80',
            sex: 'Male',
            medicines: [
              { name: 'Paracetamol', quantity: '100 pcs' },
              { name: 'Bato', quantity: '1 tablet' },
              { name: 'Tambal sa Ubo', quantity: '1 pcs' },
              { name: 'Tambal bilar', quantity: '1000 pcs' },
            ],
            prNo: 'N/A',
            ucNo: 'N/A',
            ptrNo: 'N/A',
            createdAt: new Date().toISOString()
          }
        ];
        
        setPrescriptions(mockData);
      } catch (error) {
        toast.error('Failed to load prescriptions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, []);

  // Handlers
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const openModal = (prescription = null, edit = false) => {
    if (prescription) {
      setCurrentPrescription(prescription);
      setFormData({
        ...prescription,
        date: prescription.date || prescription.birthDate // Handle legacy data
      });
    } else {
      setFormData(initialFormData);
    }
    setIsEditing(edit);
    setModalOpen(true);
  };

  const openViewModal = (prescription) => {
    setCurrentPrescription(prescription);
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setViewModalOpen(false);
    setCurrentPrescription(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicineChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index][name] = value;
    setFormData(prev => ({ ...prev, medicines: updatedMedicines }));
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', quantity: '' }]
    }));
  };

  const removeMedicine = (index) => {
    if (formData.medicines.length <= 1) return;
    const updatedMedicines = [...formData.medicines];
    updatedMedicines.splice(index, 1);
    setFormData(prev => ({ ...prev, medicines: updatedMedicines }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing prescription
        setPrescriptions(prev =>
          prev.map(p => p.id === currentPrescription.id ? formData : p)
        );
        toast.success('Prescription updated successfully');
      } else {
        // Add new prescription
        const newPrescription = {
          id: Date.now(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        setPrescriptions(prev => [...prev, newPrescription]);
        toast.success('Prescription added successfully');
      }
      closeModal();
    } catch (error) {
      toast.error('Failed to save prescription');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Prescription?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it',
    });
    
    if (result.isConfirmed) {
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      toast.success('Prescription deleted successfully');
    }
  };

  const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-prescription, .print-prescription * {
      visibility: visible;
    }
    .print-prescription {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const rxImage = '/images/Rx.png';
const logo1 = '/images/MOPH-logo.png';
const logo2 = '/images/MOPH-logo.png';

// Update the printPrescription function
// Updated printPrescription function
const printPrescription = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription Print</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.5;
            }
            .prescription {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              margin: 10px 0;
            }
            .logo-img {
              height: 50px;
              object-fit: contain;
            }
            .province-text {
              font-weight: bold;
            }
            .hospital-name {
              text-align: center;
              font-weight: bold;
              margin: 20px 0;
              text-transform: uppercase;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 5px 0;
            }
            .patient-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            .patient-info-left {
              text-align: left;
            }
            .patient-info-right {
              text-align: right;
            }
            .medicines {
              margin: 15px 0;
              padding-left: 20px;
            }
            .rx-img {
              height: 60px;
              margin-bottom: 5px;
            }
            .license-info {
              text-align: right;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="prescription">
            <div class="header">
              <div>Republic of the Philippines</div>
              <div class="logo-container">
                <img src="${logo1}" class="logo-img" alt="Logo" />
                <div class="province-text">PROVINCE OF MISAMIS ORIENTAL</div>
                <img src="${logo2}" class="logo-img" alt="MOPH Logo" />
              </div>
              <div>Balingasag, Misamis Oriental</div>
            </div>
            
            <div class="hospital-name">
              MISAMIS ORIENTAL PROVINCIAL HOSPITAL – BALINGASAG
            </div>
            
            <div class="patient-info">
              <div class="patient-info-left">
                <div>Name: ${currentPrescription.patientName}</div>
                <div>Address: ${currentPrescription.address}</div>
              </div>
              <div class="patient-info-right">
                <div>Hospital. #: ${currentPrescription.hospitalNo}</div>
                <div>Date: ${new Date(currentPrescription.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                <div>Age/Sex: ${currentPrescription.age} – ${currentPrescription.sex}</div>
              </div>
            </div>
            
            <div class="medicines">
              <img src="${rxImage}" class="rx-img" alt="Rx" />
              ${currentPrescription.medicines.map(med => 
                `<div>- ${med.name} - ${med.quantity}</div>`
              ).join('')}
            </div>
            
            <div class="license-info">
              <div>PRTSC: ${currentPrescription.prNo}</div>
              <div>LIC.#: ${currentPrescription.ucNo}</div>
              <div>PTR.#: ${currentPrescription.ptrNo}</div>
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
  };

  const handlePrint = () => {
    printPrescription();
  };

  // Filter prescriptions based on search
  const filteredPrescriptions = prescriptions.filter(p =>
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hospitalNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mt-1">
              {filteredPrescriptions.length} {filteredPrescriptions.length === 1 ? 'record' : 'records'} found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search prescriptions..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            {/* Add Prescription Button */}
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              <FaPlus className="mr-2 h-3 w-3" />
              Add Prescription
            </button>
          </div>
        </div>
      </div>

      {/* Prescriptions Table */}
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
                      Patient Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hospital No
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicines
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map((prescription, index) => (
                      <tr key={prescription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {prescription.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prescription.hospitalNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(prescription.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {prescription.medicines.length} medicines
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => openViewModal(prescription)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View"
                            >
                              <FaEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal(prescription, true)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prescription.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {searchQuery ? 'No matching prescriptions found' : 'No prescriptions available'}
                          </h3>
                          <p className="text-sm text-gray-500 max-w-md">
                            {searchQuery ? 'Try adjusting your search query' : 'Click "Add Prescription" to create a new one'}
                          </p>
                          {!searchQuery && (
                            <button
                              onClick={() => openModal()}
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                            >
                              <FaPlus className="mr-2 h-3 w-3" />
                              Add Prescription
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

      {/* Add/Edit Prescription Modal */}
      {modalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isEditing ? 'Edit Prescription' : 'Add New Prescription'}
                      </h3>
                      <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      {/* Patient Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                          <input
                            type="text"
                            name="patientName"
                            value={formData.patientName}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hospital No</label>
                          <input
                            type="text"
                            name="hospitalNo"
                            value={formData.hospitalNo}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                          <input
                            type="text"
                            name="age"
                            value={formData.age}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                          <select
                            name="sex"
                            value={formData.sex}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>

                      {/* Medicines */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medicines</label>
                        {formData.medicines.map((medicine, index) => (
                          <div key={index} className="flex items-center gap-3 mb-3">
                            <input
                              type="text"
                              placeholder="Medicine name"
                              name="name"
                              value={medicine.name}
                              onChange={(e) => handleMedicineChange(index, e)}
                              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Quantity"
                              name="quantity"
                              value={medicine.quantity}
                              onChange={(e) => handleMedicineChange(index, e)}
                              className="w-28 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                            {formData.medicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMedicine(index)}
                                className="text-red-500 hover:text-red-700 transition"
                              >
                                <FaTimes size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addMedicine}
                          className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition"
                        >
                          <FaPlus className="mr-1" /> Add Medicine
                        </button>
                      </div>

                      {/* License Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PRTSC</label>
                          <input
                            type="text"
                            name="prNo"
                            value={formData.prNo}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">LIC.#</label>
                          <input
                            type="text"
                            name="ucNo"
                            value={formData.ucNo}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PTR.#</label>
                          <input
                            type="text"
                            name="ptrNo"
                            value={formData.ptrNo}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-4 pt-6">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                        >
                          {isEditing ? 'Update' : 'Save'} Prescription
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
{viewModalOpen && currentPrescription && (
  <div className="fixed z-50 inset-0 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Prescription Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="prescription-view space-y-4">
                <div className="text-center">
                  <div>Republic of the Philippines</div>
                  <div className="flex justify-center items-center gap-5 my-2">
                    <img src={logo1} alt="Logo" className="h-12" />
                    <div className="font-bold">PROVINCE OF MISAMIS ORIENTAL</div>
                    <img src={logo2} alt="MOPH Logo" className="h-12" />
                  </div>
                  <div>Balingasag, Misamis Oriental</div>
                </div>
                
                <div className="text-center font-bold my-4 py-2 border-t border-b border-gray-300 uppercase">
                  MISAMIS ORIENTAL PROVINCIAL HOSPITAL – BALINGASAG
                </div>
                
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div>Name: {currentPrescription.patientName}</div>
                    <div>Address: {currentPrescription.address}</div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div>Hospital. #: {currentPrescription.hospitalNo}</div>
                    <div>Date: {new Date(currentPrescription.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                    <div>Age/Sex: {currentPrescription.age} – {currentPrescription.sex}</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <img src={rxImage} alt="Rx" className="h-15 mb-2" />
                  <div className="ml-4 space-y-1">
                    {currentPrescription.medicines.map((medicine, index) => (
                      <div key={index}>- {medicine.name} - {medicine.quantity}</div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 text-right">
                  <div>PRTSC: {currentPrescription.prNo}</div>
                  <div>LIC.#: {currentPrescription.ucNo}</div>
                  <div>PTR.#: {currentPrescription.ptrNo}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={printPrescription}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            <FaPrint className="mr-2 h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </Layout>
  );
};

export default PrescriptionList;
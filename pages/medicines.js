import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import ProfileImage from '@/components/ProfileImage';
import { FaTrash, FaEdit, FaPlus, FaPrint, FaDownload, FaSearch } from "react-icons/fa";
import { HiOutlineBell } from 'react-icons/hi';
import Swal from 'sweetalert2';



const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    drug_description: '',
    brand_name: '',
    lot_batch_no: '',
    expiry_date: '',
    physical_balance: ''
  });


  const [errors, setErrors] = useState({});
  const [newlyAdded, setNewlyAdded] = useState(new Set());
  const [isDuplicate, setIsDuplicate] = useState(false);
  const modalRef = useRef(null);


  const fetchData = async () => {
    try {
      const response = await fetch("/api/medicines");
      if (!response.ok) {
        throw new Error("Failed to fetch medicines");
      }
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      fetchData(); // Fetch all data when search is empty
    } else {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  // Search function
  const handleSearch = async (query) => {
    try {
      const response = await fetch(`/api/medicines?search=${query}`);
      if (!response.ok) {
        throw new Error("Failed to search medicines");
      }
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error("Error searching medicines:", error);
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedMedicine = { ...newMedicine, [name]: value };
    setNewMedicine(updatedMedicine);
    setErrors({ ...errors, [name]: '' });

    // Check for duplicate
    const duplicate = medicines.some((med) =>
      med.drug_description.toLowerCase() === updatedMedicine.drug_description.toLowerCase() &&
      med.brand_name.toLowerCase() === updatedMedicine.brand_name.toLowerCase() &&
      med.lot_batch_no.toLowerCase() === updatedMedicine.lot_batch_no.toLowerCase() &&
      med.expiry_date === updatedMedicine.expiry_date
    );

    setIsDuplicate(duplicate);
  };

  const addMedicine = async () => {
    let newErrors = {};
    if (!newMedicine.drug_description) newErrors.drug_description = 'Drug description is required';
    if (!newMedicine.brand_name) newErrors.brand_name = 'Brand name is required';
    if (!newMedicine.lot_batch_no) newErrors.lot_batch_no = 'Lot/Batch number is required';
    if (!newMedicine.expiry_date) newErrors.expiry_date = 'Expiry date is required';
    if (!newMedicine.physical_balance) newErrors.physical_balance = 'Physical balance is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isDuplicate) {
      Swal.fire({
        icon: 'warning',
        title: 'Duplicate Entry',
        text: 'This medicine record already exists!',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedicine),
      });

      if (res.ok) {
        const addedMed = await res.json();
        const updatedMedicines = [...medicines, addedMed].sort((a, b) => a.drug_description.localeCompare(b.drug_description));

        setMedicines(updatedMedicines);
        setNewlyAdded((prev) => new Set([...prev, addedMed.item_no]));

        setIsModalOpen(false);
        setNewMedicine({ drug_description: '', brand_name: '', lot_batch_no: '', expiry_date: '', physical_balance: '' });
        setErrors({});
        setIsDuplicate(false);

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Medicine added successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        console.error('Error adding medicine:', await res.text());
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Something went wrong. Try again later.',
      });
    }
  };

  const deleteMedicine = async (itemNo) => {
  const confirmDelete = await Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (confirmDelete.isConfirmed) {
    try {
      const res = await fetch(`/api/medicines?item_no=${itemNo}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMedicines(medicines.filter((med) => med.item_no !== itemNo));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "The medicine has been removed.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error("Failed to delete medicine");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete medicine. Try again later.",
      });
    }
  }
};


const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [selectedMedicine, setSelectedMedicine] = useState(null);
const [editMedicine, setEditMedicine] = useState({
  drug_description: '',
  brand_name: '',
  lot_batch_no: '',
  expiry_date: '',
  physical_balance: '',
});
const [editErrors, setEditErrors] = useState({});
const [isSaving, setIsSaving] = useState(false); // Loading state

// Open Edit Modal (Excludes Item No)
const openEditModal = (medicine) => {
  setSelectedMedicine(medicine);
  const { item_no, ...editableFields } = medicine; // Exclude item_no
  setEditMedicine(editableFields);
  setEditErrors({}); // Clear previous errors
  setIsEditModalOpen(true);
};

// Handle Input Changes
const handleEditInputChange = (e) => {
  const { name, value } = e.target;
  setEditMedicine({ ...editMedicine, [name]: value });

  // Live Validation
  if (!value.trim()) {
    setEditErrors((prev) => ({ ...prev, [name]: "This field is required." }));
  } else {
    setEditErrors((prev) => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }
};

// Validate Input Fields
const validateEditFields = () => {
  let errors = {};
  if (!editMedicine.drug_description.trim()) errors.drug_description = "Drug description is required.";
  if (!editMedicine.brand_name.trim()) errors.brand_name = "Brand name is required.";
  if (!editMedicine.lot_batch_no.trim()) errors.lot_batch_no = "Lot/Batch number is required.";
  if (!editMedicine.expiry_date) errors.expiry_date = "Expiry date is required.";
  if (editMedicine.physical_balance === '' || editMedicine.physical_balance < 0)
    errors.physical_balance = "Physical balance must be a valid number.";

  setEditErrors(errors);
  return Object.keys(errors).length === 0;
};

// Save Edited Medicine to DB
const saveEditedMedicine = async () => {
  if (!validateEditFields()) return; // Stop execution if validation fails

  // Check if any field has changed (trim strings & convert numbers)
  const isUnchanged = Object.keys(editMedicine).every((key) => {
    const newValue =
      key === "physical_balance"
        ? Number(editMedicine[key])
        : String(editMedicine[key]).trim();
    const oldValue =
      key === "physical_balance"
        ? Number(selectedMedicine[key])
        : String(selectedMedicine[key]).trim();
    return newValue === oldValue;
  });

  if (isUnchanged) {
    Swal.fire({
      icon: "success",
      title: "Saved Successfully",
      text: "No changes were made.",
      timer: 2000,
      showConfirmButton: false,
    });
    setIsEditModalOpen(false);
    return;
  }

  try {
    setIsSaving(true); // Show loading state

    const response = await fetch('/api/medicines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editMedicine, item_no: selectedMedicine.item_no }), // Keep item_no for API
    });

    if (!response.ok) throw new Error("Failed to update medicine");

    setMedicines((prev) =>
      prev.map((med) => (med.item_no === selectedMedicine.item_no ? { ...med, ...editMedicine } : med))
    );

    // Show success notification
    Swal.fire({
      icon: "success",
      title: "Updated Successfully",
      text: "Medicine details have been updated!",
      timer: 2000,
      showConfirmButton: false,
    });

    setIsEditModalOpen(false); // Close modal
  } catch (error) {
    console.error("Error updating medicine:", error);
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: "Something went wrong. Please try again.",
    });
  } finally {
    setIsSaving(false); // Hide loading state
  }
};


  return (
    <Layout>
    {/* Buttons & Search Bar - Hidden in Print */}
    <div className="flex justify-between items-center bg-gradient-to-r from-teal-500 to-blue-600 p-5 rounded-xl shadow-lg print:hidden">
      {/* Buttons Container */}
      <div className="flex space-x-4">
        {[
          { icon: <FaPlus />, text: "Add", action: () => setIsModalOpen(true) },
          {
            icon: <FaPrint />,
            text: "Print",
            action: () => window.print(), // Print Function
          },
          {
            icon: <FaDownload />,
            text: "Download",
            action: () => {
              const csvContent = `data:text/csv;charset=utf-8,${[
                ["Item No", "Drug Description", "Brand Name", "Lot/Batch No", "Expiry Date", "Physical Balance"],
                ...medicines.map((med) => [
                  med.item_no,
                  med.drug_description,
                  med.brand_name,
                  med.lot_batch_no,
                  med.expiry_date,
                  med.physical_balance,
                ]),
              ]
                .map((e) => e.join(","))
                .join("\n")}`;
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "medicines.csv");
              document.body.appendChild(link);
              link.click();
            },
          },
        ].map(({ icon, text, action }, index) => (
          <button
            key={index}
            onClick={action}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg shadow-md hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            <span className="text-teal-600 text-xl">{icon}</span>
            <span className="font-semibold">{text} Medicine</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center bg-white/30 backdrop-blur-md border border-white/40 rounded-full px-4 py-2 shadow-inner">
        <FaSearch className="text-white/90" />
        <input
          type="text"
          placeholder="Search Medicine"
          className="ml-2 outline-none bg-transparent text-white placeholder-white/80 w-[250px]"
          value={searchQuery}
          onChange={(e) => {
            const query = e.target.value.toLowerCase();
            setSearchQuery(query);

            if (query === '') {
              setMedicines([...medicines]); // Restore original list when cleared
            } else {
              setMedicines(
                medicines.filter((med) =>
                  med.drug_description.toLowerCase().includes(query) ||
                  med.brand_name.toLowerCase().includes(query) ||
                  med.lot_batch_no.toLowerCase().includes(query)
                )
              );
            }
          }}
        />
      </div>
    </div>

    {/* Medicine Table - The Only Thing Printed */}
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6 border border-gray-200 print:w-full print:shadow-none">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-left">
          <tr className="uppercase tracking-wide text-sm">
            <th className="py-4 px-6 font-semibold">Item No.</th>
            <th className="py-4 px-6 font-semibold">Drug Description</th>
            <th className="py-4 px-6 font-semibold">Brand Name</th>
            <th className="py-4 px-6 font-semibold">Lot/Batch No.</th>
            <th className="py-4 px-6 font-semibold">Expiry Date</th>
            <th className="py-4 px-6 font-semibold text-center">Physical Balance</th>
            <th className="py-4 px-6 font-semibold text-center print:hidden">Actions</th> {/* Hide Actions on Print */}
          </tr>
        </thead>

{/* Table Body */}
<tbody className="divide-y divide-gray-200 bg-gray-50">
  {medicines.map((med, index) => (
    <tr
      key={med.item_no}
      className={`transition-all hover:bg-blue-100 ${
        newlyAdded.has(med.item_no) ? 'bg-green-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      {/* Item No. */}
      <td className="py-4 px-6 text-gray-800 font-semibold text-center">{med.item_no}</td>

      {/* Drug Description */}
      <td className="py-4 px-6 text-gray-700">{med.drug_description}</td>

      {/* Brand Name */}
      <td className="py-4 px-6 text-gray-700">{med.brand_name}</td>

      {/* Lot/Batch No. */}
      <td className="py-4 px-6 text-gray-700">{med.lot_batch_no}</td>

      {/* Expiry Date (No Background) */}
      <td className="py-4 px-6 text-gray-700 text-center">
        {new Date(med.expiry_date).toISOString().split('T')[0]}
      </td>

      {/* Physical Balance - Turns red if below 1000 */}
      <td
        className={`py-4 px-6 text-center font-bold ${
          med.physical_balance < 1000 ? 'text-red-500' : 'text-gray-900'
        }`}
      >
        {med.physical_balance}
      </td>

      {/* Actions (Hidden on Print) */}
      <td className="py-4 px-6 flex justify-center space-x-3 print:hidden">
        {/* Edit Button */}
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md shadow-md transition flex items-center space-x-1"
          onClick={() => openEditModal(med)}
        >
          <FaEdit size={16} />
          <span>Edit</span>
        </button>

        {/* Delete Button */}
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md shadow-md transition flex items-center space-x-1"
          onClick={() => deleteMedicine(med.item_no)}
        >
          <FaTrash size={16} />
          <span>Delete</span>
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </div>

{/* Add Medicine Modal */}
{isModalOpen && (
  <div 
    className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md transition-opacity"
    onClick={() => {
      setIsModalOpen(false);
      setErrors({}); // Reset errors when closing
    }}
  >
    <div 
      className="relative bg-white p-8 rounded-2xl shadow-2xl w-[420px] border border-gray-200 
                  animate-fadeIn scale-95 transition-transform duration-300"
      onClick={(e) => e.stopPropagation()} // Prevent click inside from closing modal
    >
      {/* Modal Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Add Medicine</h2>

      {/* Input Fields for New Medicine */}
      <div className="space-y-4">
        {Object.keys(newMedicine).map((field) => (
          <div key={field} className="relative">
            <input
              type={field === "expiry_date" ? "date" : field === "physical_balance" ? "number" : "text"}
              name={field}
              value={newMedicine[field]}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg bg-gray-100 shadow-sm text-gray-900 
                         focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500 
                         ${errors[field] ? "border-red-500" : "border-gray-300"}`}
              placeholder={field.replace("_", " ").toUpperCase()}
            />
            {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
          </div>
        ))}
        {isDuplicate && <p className="text-red-500 text-xs">This medicine already exists!</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={() => {
            setIsModalOpen(false);
            setErrors({}); // Reset errors when closing
          }}
          className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={addMedicine}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isDuplicate || isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}

{/* Edit Medicine Modal */}
{isEditModalOpen && (
  <div 
    className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md transition-opacity"
    onClick={() => {
      setIsEditModalOpen(false);
      setEditErrors({}); // Reset errors when closing
    }}
  >
    <div 
      className="relative bg-white p-8 rounded-2xl shadow-2xl w-[420px] border border-gray-200 
                  animate-fadeIn scale-95 transition-transform duration-300"
      onClick={(e) => e.stopPropagation()} // Prevent click inside from closing modal
    >
      {/* Modal Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Medicine</h2>

      {/* Input Fields for Editing */}
      <div className="space-y-4">
        {Object.keys(editMedicine).map((field) => (
          <div key={field} className="relative">
            <input
              type={field === "expiry_date" ? "date" : field === "physical_balance" ? "number" : "text"}
              name={field}
              value={editMedicine[field]}
              onChange={handleEditInputChange}
              className={`w-full px-4 py-3 border rounded-lg bg-gray-100 shadow-sm text-gray-900 
                         focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500 
                         ${editErrors[field] ? "border-red-500" : "border-gray-300"}`}
              placeholder={field.replace("_", " ").toUpperCase()}
            />
            {editErrors[field] && <p className="text-red-500 text-xs mt-1">{editErrors[field]}</p>}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={() => {
            setIsEditModalOpen(false);
            setEditErrors({}); // Reset errors when closing
          }}
          className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={saveEditedMedicine}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}
    </Layout>
  );
};

export default Medicines;

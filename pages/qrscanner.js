"use client";
import { QrCode, Check, Edit, X, Info, ArrowLeft, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QrScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const mockResult = {
        id: Math.floor(Math.random() * 1000),
        name: 'Omeprazole',
        dosage: '20mg',
        category: 'GI Drug',
        stock: 45,
        lastScanned: new Date().toLocaleDateString(),
      };
      
      setScanResult(mockResult);
      setShowActions(true);
      setIsScanning(false);
    }, 1500);
  };

  const handleAction = (action) => {
    switch(action) {
      case 'details':
        router.push(`/medicines/${scanResult.id}`);
        break;
      case 'edit':
        router.push(`/medicines/${scanResult.id}/edit`);
        break;
      case 'prescribe':
        router.push(`/prescriptions/new?medicineId=${scanResult.id}`);
        break;
      default:
        break;
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setShowActions(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col bg-transparent">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-200/50 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {showActions ? 'Medicine Found' : 'Scan Medicine QR Code'}
          </h1>
          <button 
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100/50 transition-colors"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!showActions ? (
          <>
            {/* Scanner View */}
            <div className="relative flex-grow rounded-xl mb-6 flex flex-col items-center justify-center overflow-hidden bg-transparent">
              {/* Scanner frame with transparent center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Semi-transparent overlay around scanner area */}
                  <div className="absolute inset-0 bg-black/5 backdrop-blur-sm">
                    {/* Transparent cutout area */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      w-64 h-64 border-4 border-blue-400/80 rounded-lg bg-transparent shadow-lg"></div>
                  </div>
                </div>
              </div>
              
              {isScanning ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-sm">
                    <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-800 font-medium text-lg">Scanning...</p>
                  </div>
                </div>
              ) : (
                <div className="relative z-0 flex flex-col items-center p-6 text-center bg-white/80 backdrop-blur-sm rounded-xl mx-4 shadow-sm">
                  <div className="bg-blue-50/80 p-4 rounded-full mb-4">
                    <QrCode className="h-8 w-8 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Align QR Code Within Frame
                  </h2>
                  <p className="text-gray-600 max-w-xs">
                    Position the medicine's QR code inside the frame to scan automatically
                  </p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-auto bg-white/80 backdrop-blur-sm rounded-xl p-4">
              <button
                onClick={handleScan}
                disabled={isScanning}
                className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center transition-all mb-4
                  ${isScanning 
                    ? 'bg-gray-400/80 cursor-not-allowed' 
                    : 'bg-blue-600/90 hover:bg-blue-700 shadow-md text-white'}`}
              >
                <QrCode className="h-5 w-5 mr-2" />
                {isScanning ? 'Scanning...' : 'Simulate Scan'}
              </button>
              
              <p className="text-center text-gray-600 mt-4">
                Can't scan?{' '}
                <button 
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  onClick={() => router.push('/medicines/add')}
                >
                  Enter manually
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Scan Results */}
            <div className="bg-gray-100/90 rounded-xl p-5 mb-6 border border-gray-300/50">
              <div className="flex items-start">
                <div className="bg-gray-200/80 p-2.5 rounded-full mr-4 flex-shrink-0">
                  <Check className="h-6 w-6 text-gray-700" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Scan Successful!</h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Medicine Name</p>
                      <p className="font-semibold text-gray-900 mt-1">{scanResult.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Dosage</p>
                      <p className="font-semibold text-gray-900 mt-1">{scanResult.dosage}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Category</p>
                      <p className="font-semibold text-gray-900 mt-1">{scanResult.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Available Stock</p>
                      <p className="font-semibold text-gray-900 mt-1">{scanResult.stock} units</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex-grow">
              <h3 className="font-medium text-gray-700 mb-3 text-lg">Available Actions</h3>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleAction('details')}
                  className="w-full flex items-center justify-between p-4 bg-white/90 border border-gray-200/50 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-50/80 p-2.5 rounded-xl mr-3 group-hover:bg-blue-100/80 transition-colors">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Details</p>
                      <p className="text-sm text-gray-500">See complete medicine information</p>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
                </button>

                <button
                  onClick={() => handleAction('edit')}
                  className="w-full flex items-center justify-between p-4 bg-white/90 border border-gray-200/50 rounded-xl hover:border-amber-200 hover:bg-amber-50/50 transition-colors group"
                >
                  <div className="flex items-center">
                    <div className="bg-amber-50/80 p-2.5 rounded-xl mr-3 group-hover:bg-amber-100/80 transition-colors">
                      <Edit className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Edit Information</p>
                      <p className="text-sm text-gray-500">Update medicine details</p>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:text-amber-600 transition-colors">→</span>
                </button>

                <button
                  onClick={() => handleAction('prescribe')}
                  className="w-full flex items-center justify-between p-4 bg-white/90 border border-gray-200/50 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-colors group"
                >
                  <div className="flex items-center">
                    <div className="bg-green-50/80 p-2.5 rounded-xl mr-3 group-hover:bg-green-100/80 transition-colors">
                      <ClipboardList className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Create Prescription</p>
                      <p className="text-sm text-gray-500">Prescribe this medicine</p>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600 transition-colors">→</span>
                </button>
              </div>
            </div>

            {/* Footer Button */}
            <button
              onClick={resetScanner}
              className="w-full py-3.5 text-gray-800 font-medium hover:bg-gray-50/80 rounded-xl transition-colors flex items-center justify-center border border-gray-200/50 mt-auto"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Scan Another Medicine
            </button>
          </>
        )}
      </div>
    </div>
  );
}
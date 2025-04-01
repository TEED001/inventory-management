'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon } from '@heroicons/react/24/solid';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ firstName: false, lastName: false, email: false, password: false });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {
      firstName: !firstName,
      lastName: !lastName,
      email: !email,
      password: !password,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).includes(true)) {
      Swal.fire({
        title: "Missing Information!",
        text: "Please fill in all required fields.",
        icon: "warning",
        confirmButtonColor: "#ffc107",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Swal.fire({
        title: "Account Created!",
        text: "You have successfully signed up.",
        icon: "success",
        confirmButtonColor: "#28a745",
        confirmButtonText: "Login Now",
      }).then(() => {
        router.push('/Login');
      });

    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#dc3545",
        confirmButtonText: "OK",
      });
    }
  };

  // ✅ Smooth transition before navigating to Login page
  const handleLoginTransition = (e) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/Login');
    }, 600);
  };

  return (
    <AnimatePresence>
      {!isTransitioning && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }} // Smooth fade-out and slide up
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center items-center min-h-screen bg-gray-100 font-poppins"
        >
          <div className="mb-6">
            <Image src="/images/MOPH-logo.png" alt="MOPH Logo" width={150} height={150} />
          </div>

          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <h2 className="text-center text-2xl font-bold text-white bg-green-600 py-4 tracking-wide">
              SIGN UP
            </h2>
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-gray-800 font-medium mb-1">First Name</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.firstName ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-green-400"
                  } text-gray-700 font-light`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">First name is required.</p>}
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-1">Last Name</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.lastName ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-green-400"
                  } text-gray-700 font-light`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">Last name is required.</p>}
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-green-400"
                  } text-gray-700 font-light`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">Email is required.</p>}
              </div>

              <div className="relative">
                <label className="block text-gray-800 font-medium mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                      errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-green-400"
                    } text-gray-700 font-light`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">Password is required.</p>}
              </div>

              <p className="text-sm text-gray-600 text-left">
                Already have an account?{' '}
                <a href="#" onClick={handleLoginTransition} className="text-blue-600 font-medium hover:underline">
                  Login here.
                </a>
              </p>

              <button 
                type="submit" 
                className="w-full bg-green-600 text-white py-2 mt-6 rounded-full hover:bg-green-700 text-lg font-medium transition-all duration-300"
              >
                Sign Up
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

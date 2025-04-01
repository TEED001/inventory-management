'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon } from '@heroicons/react/24/solid';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchMedicines();
    }
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicines', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medicines.');
      }

      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = { email: !email, password: !password };
    setErrors(newErrors);

    if (!email || !password) {
      Swal.fire({
        title: 'Missing Information!',
        text: 'Please fill in both email and password fields.',
        icon: 'warning',
        confirmButtonColor: '#ffc107',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      // Store authentication token
      localStorage.setItem('authToken', data.token);

      Swal.fire({
        title: 'Login Successful!',
        text: 'Welcome to Medicines Management.',
        icon: 'success',
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Proceed',
      }).then(() => {
        fetchMedicines();
        router.push('/medicines'); // <-- Redirects to Medicines Page
      });
      
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleSignUpTransition = (e) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/signup');
    }, 600);
  };

  return (
    <AnimatePresence>
      {!isTransitioning && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center items-center min-h-screen bg-gray-100 font-poppins"
        >
          <div className="mb-6">
            <Image src="/images/MOPH-logo.png" alt="MOPH Logo" width={150} height={150} />
          </div>

          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <h2 className="text-center text-2xl font-bold text-white bg-green-600 py-4 tracking-wide">
              MOPH LOGIN
            </h2>
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-gray-800 font-medium mb-1">Email</label>
                <input
                  type="email"
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-green-400'
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
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                      errors.password ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-green-400'
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

              <div className="text-sm text-gray-600 mt-2">
                <Link href="/forgot-password" className="text-blue-600 font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Don't have an account?{' '}
                <a href="#" onClick={handleSignUpTransition} className="text-blue-600 font-medium hover:underline">
                  Sign up
                </a>{' '}
                now.
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 mt-6 rounded-full hover:bg-green-700 text-lg font-medium transition-all duration-300"
              >
                Sign In
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

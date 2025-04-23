'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [loginMethod, setLoginMethod] = useState('email');
  const [qrCodeScanned, setQrCodeScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (loginMethod === 'qr') {
      // Simulate QR code scan
      setQrCodeScanned(true);
      setTimeout(() => {
        Swal.fire({
          title: 'QR Login Successful',
          text: 'Welcome to Medicines Management.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Continue',
        }).then(() => {
          router.push('/medicines');
        });
      }, 1500);
      return;
    }

    const newErrors = {
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      password: password.length < 6
    };
    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please check your email and password.',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'OK',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      if (rememberMe) {
        localStorage.setItem('authToken', data.token);
      } else {
        sessionStorage.setItem('authToken', data.token);
      }

      await Swal.fire({
        title: 'Login Successful',
        text: 'Welcome to Medicines Management.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Continue',
      });
      
      router.push('/medicines');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md"> 
        <div className="flex justify-center">
          <Image 
            src="/images/MOPH-logo.png" 
            alt="MOPH Logo" 
            width={120} 
            height={120} 
            className="h-20 w-auto"
            priority
          />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
          Medicines Management System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your medicines effectively
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow rounded-lg sm:px-8 border border-gray-200">
          {/* Login Method Toggle */}
          <div className="flex rounded-md shadow-sm mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 text-sm font-medium focus:outline-none transition-colors ${
                loginMethod === 'email' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('qr')}
              className={`flex-1 py-2 px-4 text-sm font-medium focus:outline-none transition-colors ${
                loginMethod === 'qr' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              QR Login
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">Password must be at least 6 characters</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isLoading ? 'bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-48 w-48 rounded-md bg-gray-50 p-4 mb-6 relative overflow-hidden">
                {qrCodeScanned ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-50 rounded-md">
                    <div className="text-green-600 font-medium text-sm">Authentication Successful</div>
                  </div>
                ) : (
                  <>
                    <QrCodeIcon className="h-32 w-32 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-ping h-8 w-8 rounded-full bg-indigo-400 opacity-75"></div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan the QR code with your mobile app to login
              </p>
              <button
                onClick={handleSubmit}
                disabled={qrCodeScanned}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  qrCodeScanned ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {qrCodeScanned ? 'Continue to Dashboard' : 'Use QR Code'}
              </button>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/signup"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create a new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
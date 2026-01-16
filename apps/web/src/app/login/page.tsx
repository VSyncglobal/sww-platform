'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { X, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const { register, handleSubmit, reset } = useForm();

  if (!isOpen) return null;

  // High contrast inputs (Dark Text on Light Gray)
  const inputClasses = "w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-xl focus:border-blue-800 focus:bg-white block w-full p-3.5 transition-all outline-none font-bold placeholder:text-gray-400";

  // --- BUTTON STYLES (EXPLICIT COLORS) ---
  // Login Button: Blue -> Gold
  const loginBtnStyle = "bg-[#1e3a8a] text-white hover:bg-[#d97706] hover:text-[#1e3a8a]";
  // Register Button: Gold -> Blue
  const registerBtnStyle = "bg-[#d97706] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white";

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = view === 'login' ? '/auth/login' : '/auth/register';
      await api.post(endpoint, data);
      
      if (view === 'register') {
        setView('login');
        setError('Registration successful! Please login.');
      } else {
        router.push('/dashboard');
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#1e3a8a]/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight">
              {view === 'login' ? 'Welcome Back.' : 'Join the Family.'}
            </h2>
            <p className="text-gray-500 font-medium mt-1">
               {view === 'login' ? 'Secure access to your funds.' : 'Start your financial journey.'}
            </p>
          </div>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Form Area */}
        <div className="px-8 pb-8">
          {error && (
            <div className={`p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 ${error.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <CheckCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {view === 'register' && (
               <div className="grid grid-cols-2 gap-3">
                 <input {...register('firstName')} placeholder="First Name" className={inputClasses} />
                 <input {...register('lastName')} placeholder="Last Name" className={inputClasses} />
               </div>
            )}

            <div>
              <input 
                {...register('email')} 
                type="email" 
                className={inputClasses}
                placeholder="Email Address"
                required 
              />
            </div>

            <div>
              <input 
                {...register('password')} 
                type="password" 
                className={inputClasses}
                placeholder="Password"
                required 
              />
            </div>
            
            {view === 'register' && (
              <div>
                <input {...register('phoneNumber')} placeholder="Phone (e.g. 2547...)" className={inputClasses} />
              </div>
            )}

            {/* DYNAMIC ACTION BUTTON */}
            <button 
              disabled={isLoading}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 mt-4 text-lg ${view === 'login' ? loginBtnStyle : registerBtnStyle}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  {view === 'login' ? 'Log In' : 'Create Account'} 
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="mt-6 text-center text-sm font-medium text-gray-500 border-t border-gray-100 pt-6">
            {view === 'login' ? "New member? " : "Already have an account? "}
            <button 
              onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); reset(); }}
              className="text-[#d97706] font-bold hover:underline ml-1"
            >
              {view === 'login' ? 'Register Now' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
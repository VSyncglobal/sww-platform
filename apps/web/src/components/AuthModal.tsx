'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { X, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
  const { login } = useAuth();
  
  const { register, handleSubmit, reset } = useForm();

  if (!isOpen) return null;

  const inputClasses = "w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm rounded-xl focus:border-sacco-blue focus:bg-white block p-3.5 transition-all outline-none font-bold placeholder:text-slate-400";
  const btnClasses = "w-full font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 mt-4 text-lg";

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = view === 'login' ? '/auth/login' : '/auth/register';
      
      // Construct clean payload
      const payload = view === 'register' ? {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber
        // Removed: nationalId, dob, gender (User fills these in Settings later)
      } : {
        email: data.email,
        password: data.password
      };

      const res = await api.post(endpoint, payload);
      
      if (view === 'register') {
        setView('login');
        setError('Registration successful! Please login.');
        reset();
      } else {
        if (res.data.accessToken && res.data.user) {
            login(res.data.accessToken, res.data.user);
            onClose();
        } else {
            throw new Error("Invalid response from server");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sacco-blue/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        <div className="bg-white px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-sacco-blue tracking-tight">
              {view === 'login' ? 'Welcome Back.' : 'Join Us.'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
               {view === 'login' ? 'Secure access to your funds.' : 'Start your financial journey.'}
            </p>
          </div>
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className={`p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 ${error.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <CheckCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {view === 'register' && (
               <div className="grid grid-cols-2 gap-3">
                 <input {...register('firstName')} placeholder="First Name" className={inputClasses} required />
                 <input {...register('lastName')} placeholder="Last Name" className={inputClasses} required />
               </div>
            )}

            <div>
              <input {...register('email')} type="email" className={inputClasses} placeholder="Email Address" required />
            </div>
            
            {view === 'register' && (
              <div>
                <input {...register('phoneNumber')} type="tel" className={inputClasses} placeholder="Phone (2547...)" required />
              </div>
            )}

            <div>
              <input {...register('password')} type="password" className={inputClasses} placeholder="Password" required />
            </div>
            
            <button 
              disabled={isLoading}
              className={`${btnClasses} ${view === 'login' 
                ? 'bg-sacco-blue text-white hover:bg-sacco-gold hover:text-sacco-blue' 
                : 'bg-sacco-orange text-white hover:bg-sacco-blue'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  {view === 'login' ? 'Log In' : 'Create Account'} 
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm font-medium text-slate-500 border-t border-slate-100 pt-6">
            {view === 'login' ? "New member? " : "Already have an account? "}
            <button 
              onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); reset(); }}
              className="text-sacco-orange font-bold hover:underline ml-1"
            >
              {view === 'login' ? 'Register Now' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, Phone, Mail, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

// --- IMAGES ---
const slides = [
  "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1920&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1591894509537-c42013bc8bbd?q=80&w=1920&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920&auto=format&fit=crop"
];

export default function Home() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const openModal = (view: 'login' | 'register') => {
    setModalView(view);
    setModalOpen(true);
  };

  // --- BUTTON STYLES ---
  const btnBlueToGold = "bg-[#1e3a8a] text-white hover:bg-[#d97706] hover:text-[#1e3a8a] transition-colors duration-300 font-bold shadow-lg";
  const btnGoldToBlue = "bg-[#d97706] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-colors duration-300 font-bold shadow-lg";

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* 1. NAVBAR - White Box with Curved Bottom */}
      <nav className="fixed w-full z-50 top-0 left-0">
        <div className="bg-white shadow-xl rounded-b-[3rem] h-24 relative z-50 px-8">
          <div className="max-w-7xl mx-auto h-full flex justify-between items-center">
            
            {/* LOGO (Dark Text for White Background) */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 bg-[#d97706] flex items-center justify-center rounded-xl shadow-md transform group-hover:rotate-6 transition-transform">
                  <span className="text-white font-black text-xl">SM</span>
              </div>
              <div className="flex flex-col leading-none">
                  <span className="text-[#1e3a8a] font-black text-xl tracking-tight">SM Welfare</span>
                  <span className="text-[#d97706] text-xs font-bold tracking-widest uppercase">Platform</span>
              </div>
            </div>
            
            {/* Nav Buttons */}
            <div className="flex space-x-4">
              <button 
                onClick={() => openModal('login')} 
                className={`px-6 py-2.5 rounded-full text-sm uppercase tracking-wide ${btnBlueToGold}`}
              >
                Login
              </button>
              <button 
                onClick={() => openModal('register')} 
                className={`px-7 py-2.5 rounded-full text-sm uppercase tracking-wide ${btnGoldToBlue}`}
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      {/* Added top padding so content clears the new navbar */}
      <section className="relative min-h-screen w-full flex flex-col justify-center pt-32 pb-32">
        
        {/* A. Background Slider */}
        <div className="absolute inset-0 z-0 bg-black">
          {slides.map((img, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[20000ms]"
                style={{ backgroundImage: `url(${img})` }}
              />
            </div>
          ))}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
        </div>

        {/* B. Content Overlay */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full">
          <div className="max-w-4xl py-12">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full mb-8 shadow-2xl shadow-blue-900/50 animate-in slide-in-from-left-10 fade-in duration-700">
              <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-blue-700 font-extrabold text-lg tracking-tight uppercase">Your Growth Partner</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-none drop-shadow-2xl">
              Panda Mbegu. <br/> 
              <span className="text-[#d97706]">
                Vuna Kesho.
              </span>
            </h1>
            
            {/* Subtext */}
            <p className="text-xl md:text-2xl text-gray-100 mb-10 leading-relaxed font-medium pl-6 border-l-8 border-[#d97706] max-w-2xl drop-shadow-lg">
              Secure savings, instant mobile loans, and a community that supports your hustle. 
              The modern Sacco for the ambitious Kenyan.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 mb-16">
              <button 
                onClick={() => openModal('register')} 
                className={`px-10 py-5 rounded-xl text-lg flex items-center justify-center gap-3 ${btnGoldToBlue}`}
              >
                Start Saving Now <ArrowRight size={24}/>
              </button>
              
              <button 
                onClick={() => openModal('login')} 
                className={`px-10 py-5 rounded-xl text-lg flex items-center justify-center ${btnBlueToGold}`}
              >
                Member Portal
              </button>
            </div>

            {/* Trust Indicators - Positioned securely above the wave */}
            <div className="flex flex-wrap gap-6 text-sm text-white font-bold relative z-20">
              <span className="flex items-center gap-2 bg-black/40 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                <CheckCircle2 size={18} className="text-[#d97706]"/> Instant Loans
              </span>
              <span className="flex items-center gap-2 bg-black/40 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                <CheckCircle2 size={18} className="text-[#d97706]"/> Secure Data
              </span>
              <span className="flex items-center gap-2 bg-black/40 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                <CheckCircle2 size={18} className="text-[#d97706]"/> Transparent
              </span>
            </div>

          </div>
        </div>

        {/* C. ANIMATED WAVE (Absolute Bottom) */}
        <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-none z-10">
          <svg className="relative block w-[calc(100%+1.3px)] h-[80px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                className="fill-white opacity-0"></path>
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
                className="fill-white"></path>
          </svg>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="bg-white pb-20 pt-10 w-full relative z-20">
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12 text-center">
               <h2 className="text-[#1e3a8a] font-black uppercase tracking-widest text-sm mb-3">Why Join SM Welfare?</h2>
               <h3 className="text-4xl font-extrabold text-gray-900">Built for Your Lifestyle</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-2xl hover:border-blue-900/20 hover:-translate-y-2 transition-all duration-300 group text-center">
                    <div className="w-16 h-16 bg-blue-100 text-[#1e3a8a] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Safe & Secure</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Your deposits are protected using bank-grade security protocols.</p>
                </div>
                
                {/* Feature 2 */}
                <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-2xl hover:border-yellow-600/50 hover:-translate-y-2 transition-all duration-300 group text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-[#d97706]/10 rounded-bl-full"></div>
                    <div className="w-16 h-16 bg-amber-100 text-[#d97706] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Loans</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Emergency? Get instant MPESA loans based on your savings history.</p>
                </div>

                {/* Feature 3 */}
                <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-2xl hover:border-blue-900/20 hover:-translate-y-2 transition-all duration-300 group text-center">
                    <div className="w-16 h-16 bg-blue-100 text-[#1e3a8a] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Users size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Welfare Support</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Automated welfare system ensures you have support during life's moments.</p>
                </div>
            </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="py-8 bg-[#1e3a8a] text-white/60 text-center w-full">
        <div className="flex flex-wrap justify-center gap-6 mb-4 text-xs font-bold tracking-wide text-white">
            <span className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"><Phone size={14}/> +254 700 000 000</span>
            <span className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"><Mail size={14}/> support@smwelfare.com</span>
            <span className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"><MapPin size={14}/> Nyeri, Kenya</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest opacity-40">&copy; {new Date().getFullYear()} SM Welfare Platform. All rights reserved.</p>
      </footer>

      {/* MODAL */}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        initialView={modalView} 
      />
    </div>
  );
}
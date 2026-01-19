'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, FileText, Loader2, HeartPulse, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function WelfarePage() {
  const { register, handleSubmit, watch, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('APPLY');

  const file = watch('document');
  const previewUrl = file?.[0] ? URL.createObjectURL(file[0]) : null;

  const onSubmit = async (data: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('amount', data.amount);
    formData.append('description', data.description);
    if (data.document[0]) formData.append('document', data.document[0]);

    try {
      await api.post('/welfare/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Claim submitted successfully. Admin will review shortly.');
      reset();
    } catch (e) {
      console.error(e);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welfare Kitty</h1>
          <p className="text-slate-500">Benevolence and social support services.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-pink-100 p-3 rounded-xl text-pink-600">
             <HeartPulse size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">File a Claim</h2>
            <p className="text-sm text-slate-500">Bereavement, Sickness, or Emergency support.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Claim Type</label>
                <select {...register('type')} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none">
                <option value="BEREAVEMENT">Bereavement</option>
                <option value="SICKNESS">Sickness / Hospitalization</option>
                <option value="MATERNITY">Maternity</option>
                <option value="EDUCATION">Education Support</option>
                <option value="OTHER">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount (KES)</label>
                <input type="number" {...register('amount')} className="w-full border border-slate-300 p-3 rounded-xl outline-none" placeholder="e.g. 5000" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
             <textarea {...register('description')} className="w-full border border-slate-300 p-3 rounded-xl outline-none" rows={4} placeholder="Please provide details about the situation..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Supporting Document (Required)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
              <input type="file" {...register('document')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.pdf" required />
              <Upload className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 font-medium">Click to upload image or PDF</p>
              <p className="text-xs text-slate-400 mt-1">Proof of hospitalization, certificate, etc.</p>
            </div>
            {previewUrl && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                 <FileText className="text-green-600" />
                 <span className="text-sm text-green-800 font-medium truncate">{file[0]?.name}</span>
                 <CheckCircle size={16} className="text-green-600 ml-auto" />
              </div>
            )}
          </div>

          <button disabled={loading} className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-blue-900/10">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Claim'}
          </button>
        </form>
      </div>
    </div>
  );
}
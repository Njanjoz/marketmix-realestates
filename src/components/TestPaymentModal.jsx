// src/components/TestPaymentModal.jsx - KSh 1 Test Payment Flow Modal

import React, { useState } from 'react';
import { ShieldCheck, Smartphone, CheckCircle, Loader2, X, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { initiateTestPayment, checkTransactionStatus } from '../services/paymentService';

export default function TestPaymentModal({ isOpen, onClose, onSuccess, title = "KSh 1 Test Payment Verification", subtitle = "Verify your M-Pesa phone number with a KSh 1 test payment before unlocking approvals." }) {
  const [phoneNumber, setPhoneNumber] = useState('2547');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [testRef, setTestRef] = useState('');

  if (!isOpen) return null;

  const handleTestPayment = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !/^254[17]\d{8}$/.test(phoneNumber)) {
      toast.error('Enter a valid M-Pesa number starting with 2547... or 2541...');
      return;
    }
    if (!fullName.trim() || !email.includes('@')) {
      toast.error('Please enter valid name and email address');
      return;
    }

    setLoading(true);
    const ref = `TEST_PAY_${Date.now()}`;
    setTestRef(ref);

    const res = await initiateTestPayment({
      phoneNumber,
      fullName,
      email,
      testRef: ref
    });

    setLoading(false);

    if (res.success) {
      toast.success('STK Push sent! Enter your M-Pesa PIN on your phone.');
      setPolling(true);
      startPolling(ref);
    } else {
      toast.error(res.message || 'Test payment initiation failed');
    }
  };

  const startPolling = (ref) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        setPolling(false);
        toast.error('Payment verification timed out. Please try again.');
        return;
      }

      const tx = await checkTransactionStatus(ref);
      if (tx.success && tx.data && (tx.data.paymentStatus === 'paid' || tx.data.status === 'completed')) {
        clearInterval(interval);
        setPolling(false);
        toast.success('✅ KSh 1 Test Payment successful! Approval unlocked.');
        if (onSuccess) onSuccess(ref);
        onClose();
      }
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {polling ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900">Waiting for M-Pesa PIN...</h4>
            <p className="mt-2 text-xs text-slate-600">Check your phone ({phoneNumber}) and enter your M-Pesa PIN to complete the KSh 1 test.</p>
          </div>
        ) : (
          <form onSubmit={handleTestPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">M-Pesa Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  required
                  type="text"
                  maxLength={12}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm font-mono outline-none focus:border-emerald-600"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Format: 2547XXXXXXXX or 2541XXXXXXXX (KSh 1 test charge)</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Test Amount</span>
              <span className="text-lg font-bold text-emerald-700">KSh 1.00</span>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Initializing STK Push...' : 'Pay KSh 1 & Verify'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

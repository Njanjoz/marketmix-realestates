// src/pages/ReceiptPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Printer } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://backened-lt67.onrender.com";

export default function ReceiptPage() {
  const { ref } = useParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ref) return;
    const fetchReceipt = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/api/ad-transaction/${ref}`);
        if (!res.ok) {
          throw new Error('Transaction or receipt not found');
        }
        const data = await res.json();
        setTransaction(data.data || data);
      } catch (err) {
        console.error('Receipt error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [ref]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Receipt Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Could not locate receipt for reference: ' + ref}</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = transaction.paymentStatus === 'paid' || transaction.status === 'completed';
  const mpesaRef = transaction.mpesaReference || transaction.mpesaCode || transaction.displayId || ref;
  const amount = Number(transaction.totalAmount || transaction.amount || 0);

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center border-b border-slate-100 pb-6 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payment Receipt</h1>
          <p className="text-xs text-slate-500 mt-1">MarketMix Kenya Official Receipt</p>
          <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            {isPaid ? '✅ Confirmed & Paid' : '⏳ Pending'}
          </span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Reference ID</span>
            <span className="font-mono font-bold text-slate-900">{ref}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">M-Pesa Code</span>
            <span className="font-mono font-bold text-emerald-700">{mpesaRef}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Description / Property</span>
            <span className="font-semibold text-slate-900">{transaction.propertyTitle || transaction.description || 'Order Payment'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Amount Paid</span>
            <span className="text-lg font-extrabold text-emerald-800">KES {amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}

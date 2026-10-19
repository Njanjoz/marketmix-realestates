import React from 'react';
import { Download } from 'lucide-react';
import { downloadTransportQuoteReceipt } from '../../utils/quoteReceipt';

export default function QuoteReceiptButton({ quote, className = '' }) {
  if (quote?.total == null) return null;
  return <button type="button" onClick={() => downloadTransportQuoteReceipt(quote)} className={`inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50 ${className}`}>
    <Download className="h-4 w-4" /> Download quote receipt
  </button>;
}

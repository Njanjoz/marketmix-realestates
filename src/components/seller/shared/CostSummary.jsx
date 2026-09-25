// src/components/seller/shared/CostSummary.jsx
import React from 'react';
import { Calculator } from 'lucide-react';

const fmt = (n) => `KSh ${(Number(n) || 0).toLocaleString()}`;

const CostSummary = ({ costs }) => {
  const {
    rent = 0,
    paymentFrequency = 'Monthly',
    depositAmount = 0,
    recurringCharges = [],
    oneTimeFees = [],
  } = costs;

  const isMonthly = paymentFrequency === 'Monthly';
  const monthlyRecurring = recurringCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const monthlyCost = isMonthly ? Number(rent) + monthlyRecurring : null;
  const oneTimeTotal = oneTimeFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const moveIn = Number(rent) + Number(depositAmount) + oneTimeTotal;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
        <Calculator className="w-4 h-4" /> Cost Summary
      </div>
      <div className="text-sm space-y-1">
        <Row label={`Rent (${paymentFrequency})`} value={fmt(rent)} />
        {recurringCharges.map((c, i) => (
          <Row key={i} label={`+ ${c.label || 'Recurring'} (${c.frequency || 'Monthly'})`} value={fmt(c.amount)} />
        ))}
        <div className="border-t border-emerald-200 pt-1 mt-1" />
        <Row label="Deposit" value={fmt(depositAmount)} />
        {oneTimeFees.map((f, i) => (
          <Row key={i} label={`+ ${f.label || 'One-time fee'}`} value={fmt(f.amount)} />
        ))}
      </div>
      <div className="border-t border-emerald-300 pt-2 mt-2 space-y-1">
        {monthlyCost !== null && (
          <div className="flex justify-between text-emerald-900 font-semibold">
            <span>Monthly cost</span>
            <span>{fmt(monthlyCost)}</span>
          </div>
        )}
        <div className="flex justify-between text-emerald-900 font-bold text-base">
          <span>Total move-in cost</span>
          <span>{fmt(moveIn)}</span>
        </div>
      </div>
      <p className="text-xs text-emerald-700">Never invent fees. Only fees entered by you are shown.</p>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between text-gray-700">
    <span>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default CostSummary;

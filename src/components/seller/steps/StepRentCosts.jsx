// src/components/seller/steps/StepRentCosts.jsx
import React, { useState } from 'react';
import { Field, Select, TextInput } from '../shared/Field';
import MoneyInput from '../shared/MoneyInput';
import CostSummary from '../shared/CostSummary';
import { Plus, Trash2 } from 'lucide-react';
import {
  PAYMENT_FREQUENCIES,
  DEPOSIT_OPTIONS,
  DEPOSIT_REFUNDABLE,
} from '../constants/propertyTaxonomy';

const FREQ_OPTIONS = ['One-time', 'Monthly', 'Weekly', 'Other'];

const StepRentCosts = ({ data, update }) => {
  const [newRecurring, setNewRecurring] = useState({ label: '', amount: '', frequency: 'Monthly' });
  const [newOneTime, setNewOneTime] = useState({ label: '', amount: '' });

  const addRecurring = () => {
    if (!newRecurring.label || !newRecurring.amount) return;
    update({ recurringCharges: [...(data.recurringCharges || []), newRecurring] });
    setNewRecurring({ label: '', amount: '', frequency: 'Monthly' });
  };

  const addOneTime = () => {
    if (!newOneTime.label || !newOneTime.amount) return;
    update({ oneTimeFees: [...(data.oneTimeFees || []), newOneTime] });
    setNewOneTime({ label: '', amount: '' });
  };

  const removeRecurring = (i) => update({ recurringCharges: data.recurringCharges.filter((_, idx) => idx !== i) });
  const removeOneTime = (i) => update({ oneTimeFees: data.oneTimeFees.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        Be transparent. Students use this to calculate their real move-in cost.
      </div>

      <Field label="Rent amount (KSh)" required>
        <MoneyInput value={data.rentAmount} onChange={(v) => update({ rentAmount: v })} />
      </Field>

      <Field label="Payment frequency" required>
        <Select
          value={data.paymentFrequency}
          onChange={(v) => update({ paymentFrequency: v })}
          options={PAYMENT_FREQUENCIES}
          placeholder="Select frequency"
        />
      </Field>

      {data.paymentFrequency === 'Semester' && (
        <Field label="Months in this semester" required>
          <TextInput
            type="number"
            min="1"
            max="12"
            placeholder="e.g., 4"
            value={data.semesterMonths || '4'}
            onChange={(v) => update({ semesterMonths: v })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Equivalent monthly rent: KSh {Math.round((Number(data.rentAmount || 0) / Math.max(1, Number(data.semesterMonths || 4)))).toLocaleString()}
          </p>
        </Field>
      )}

      <Field label="Deposit type" required>
        <Select
          value={data.depositType}
          onChange={(v) => update({ depositType: v })}
          options={DEPOSIT_OPTIONS}
          placeholder="Select deposit type"
        />
      </Field>

      {data.depositType === 'Fixed amount' && (
        <Field label="Deposit amount (KSh)" required>
          <MoneyInput value={data.depositAmount} onChange={(v) => update({ depositAmount: v })} />
        </Field>
      )}

      {data.depositType === "One month's rent" && (
        <p className="text-xs text-gray-500">
          Deposit will be calculated as one month's rent: KSh {Math.round(data.paymentFrequency === 'Semester' ? (Number(data.rentAmount || 0) / Math.max(1, Number(data.semesterMonths || 4))) : Number(data.rentAmount || 0)).toLocaleString()}
        </p>
      )}

      {data.depositType !== 'None' && (
        <Field label="Is the deposit refundable?" required>
          <Select
            value={data.depositRefundable}
            onChange={(v) => update({ depositRefundable: v })}
            options={DEPOSIT_REFUNDABLE}
            placeholder="Select"
          />
        </Field>
      )}

      {/* Recurring charges */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Recurring monthly charges</h3>
        {(data.recurringCharges || []).map((c, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
            <div className="flex-1 text-sm">
              <span className="font-medium">{c.label}</span> — KSh {Number(c.amount).toLocaleString()}
              <span className="text-gray-500"> ({c.frequency})</span>
            </div>
            <button type="button" onClick={() => removeRecurring(i)} className="p-1 text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <TextInput placeholder="Label e.g., Water" value={newRecurring.label} onChange={(v) => setNewRecurring({ ...newRecurring, label: v })} />
          <MoneyInput placeholder="Amount" value={newRecurring.amount} onChange={(v) => setNewRecurring({ ...newRecurring, amount: v })} />
          <Select value={newRecurring.frequency} onChange={(v) => setNewRecurring({ ...newRecurring, frequency: v })} options={FREQ_OPTIONS} />
        </div>
        <button type="button" onClick={addRecurring} className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
          <Plus className="w-4 h-4" /> Add recurring charge
        </button>
      </div>

      {/* One-time fees */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">One-time fees</h3>
        <p className="text-xs text-gray-500">
          Common: Agency fee, Viewing fee, Application fee, Agreement fee, Key deposit, Security deposit, Cleaning fee.
        </p>
        {(data.oneTimeFees || []).map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
            <div className="flex-1 text-sm">
              <span className="font-medium">{f.label}</span> — KSh {Number(f.amount).toLocaleString()}
            </div>
            <button type="button" onClick={() => removeOneTime(i)} className="p-1 text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TextInput placeholder="Fee label e.g., Agency fee" value={newOneTime.label} onChange={(v) => setNewOneTime({ ...newOneTime, label: v })} />
          <MoneyInput placeholder="Amount" value={newOneTime.amount} onChange={(v) => setNewOneTime({ ...newOneTime, amount: v })} />
        </div>
        <button type="button" onClick={addOneTime} className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
          <Plus className="w-4 h-4" /> Add one-time fee
        </button>
      </div>

      <CostSummary
        costs={{
          rent: data.rentAmount,
          paymentFrequency: data.paymentFrequency,
          depositAmount:
            data.depositType === "One month's rent"
              ? Number(data.rentAmount || 0)
              : Number(data.depositAmount || 0),
          recurringCharges: data.recurringCharges || [],
          oneTimeFees: data.oneTimeFees || [],
        }}
      />
    </div>
  );
};

export default StepRentCosts;

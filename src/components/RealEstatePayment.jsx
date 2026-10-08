// src/components/RealEstatePayment.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { payRealEstate } from "../services/realEstatePayment";

export default function RealEstatePayment({ property, landlord, buyer: initialBuyer }) {
  const { currentUser, userProfile } = useAuth();
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const [ref, setRef] = useState(null);

  const [buyer, setBuyer] = useState({
    fullName: initialBuyer?.fullName || userProfile?.name || currentUser?.displayName || "",
    email: initialBuyer?.email || userProfile?.email || currentUser?.email || "",
    phoneNumber: initialBuyer?.phoneNumber || userProfile?.phoneNumber || userProfile?.phone || "",
  });

  useEffect(() => {
    if (userProfile || currentUser) {
      setBuyer((prev) => ({
        fullName: prev.fullName || userProfile?.name || currentUser?.displayName || "",
        email: prev.email || userProfile?.email || currentUser?.email || "",
        phoneNumber: prev.phoneNumber || userProfile?.phoneNumber || userProfile?.phone || "",
      }));
    }
  }, [userProfile, currentUser]);

  const onClick = async () => {
    if (!buyer.phoneNumber || !buyer.email) {
      setMsg("❌ We need your phone number and email first.");
      return;
    }
    setStatus("starting");
    setMsg("Sending M-Pesa prompt…");
    try {
      const tx = await payRealEstate({ property, landlord, buyer });
      setRef(tx.orderId || tx.id);
      setStatus("done");
      setMsg(`✅ Paid. Receipt sent to ${buyer.email}.`);
    } catch (e) {
      setStatus("failed");
      setMsg(`❌ ${e.message}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-xl font-extrabold text-slate-900 mb-1">Pay Rent — {property.title}</h3>
      <p className="text-sm text-slate-500 mb-4">{property.location} · <strong className="text-emerald-700">KES {property.price.toLocaleString()}</strong></p>

      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
          <input
            type="text"
            value={buyer.fullName}
            onChange={(e) => setBuyer({ ...buyer, fullName: e.target.value })}
            placeholder="John"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
          <input
            type="email"
            value={buyer.email}
            onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
            placeholder="john@example.com"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">M-Pesa Phone Number</label>
          <input
            type="tel"
            value={buyer.phoneNumber}
            onChange={(e) => setBuyer({ ...buyer, phoneNumber: e.target.value })}
            placeholder="0783434588"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      <button
        onClick={onClick}
        disabled={status === "starting"}
        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {status === "starting"
          ? "Waiting for M-Pesa…"
          : `Pay KES ${property.price.toLocaleString()}`}
      </button>

      {msg && <p className="mt-3 text-sm font-semibold text-slate-700 text-center">{msg}</p>}

      {status === "done" && ref && (
        <div className="mt-4 text-center">
          <a href={`/receipt/${ref}`} className="inline-block text-sm font-bold text-emerald-700 underline">View Receipt</a>
        </div>
      )}
    </div>
  );
}

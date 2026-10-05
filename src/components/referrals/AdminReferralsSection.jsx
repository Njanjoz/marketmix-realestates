// src/components/referrals/AdminReferralsSection.jsx - Admin Referrals & Rewards Management

import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Clock, ShieldCheck, XCircle, Award, DollarSign, Eye } from 'lucide-react';
import { getAllReferralsAndAcquisitions, verifyAcquisitionAndCreateReward, updateRewardStatus, recordAcquisition } from '../../services/referralService';
import toast from 'react-hot-toast';

export default function AdminReferralsSection({ currentUser }) {
  const [properties, setProperties] = useState([]);
  const [acquisitions, setAcquisitions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllReferralsAndAcquisitions();
      setProperties(data.properties);
      setAcquisitions(data.acquisitions);
      setTokens(data.tokens);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyAcquisition = async (propertyId, referrerId) => {
    try {
      // Find or create acquisition record
      let acq = acquisitions.find(a => a.propertyId === propertyId);
      if (!acq) {
        const res = await recordAcquisition({
          propertyId,
          customerId: 'customer-direct',
          referrerId,
          agentId: currentUser.uid,
          acquisitionType: 'website',
        });
        if (!res.success) {
          toast.error('Could not create acquisition record');
          return;
        }
        acq = { id: res.acquisitionId, propertyId, referrerId };
      }

      const result = await verifyAcquisitionAndCreateReward({
        acquisitionId: acq.id,
        propertyId,
        referrerId,
        verifiedByAdminId: currentUser.uid,
        rewardAmount: 5000,
      });

      if (result.success) {
        toast.success(`Acquisition verified! Token code: ${result.tokenCode}`);
        loadData();
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error verifying acquisition');
    }
  };

  const handleUpdateReward = async (tokenId, status) => {
    const res = await updateRewardStatus(tokenId, status);
    if (res.success) {
      toast.success(`Reward status updated to ${status}`);
      loadData();
    } else {
      toast.error('Failed to update reward status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            Admin Management
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Referrals & Rewards Administration</h2>
          <p className="text-sm text-slate-600 mt-0.5">Verify property acquisitions and approve reward tokens for referrers.</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Submitted Properties & Referrals</h3>
          <span className="text-xs text-slate-500 font-medium">{properties.length} total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading admin referral records...</div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No property referrals found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Property ID & Title</th>
                  <th className="px-6 py-3">Submitter / Referrer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reward Token</th>
                  <th className="px-6 py-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((p) => {
                  const token = tokens.find(t => t.propertyId === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="font-mono text-xs text-emerald-700 font-bold">{p.propertyId || 'MM-RE-XXXX'}</div>
                        <div className="text-sm font-semibold">{p.title}</div>
                        <div className="text-xs text-slate-500">{p.location}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-800">{p.submittedByName || 'User'}</div>
                        <div className="text-slate-500 font-mono">{p.referralCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {p.propertyStatus || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {token ? (
                          <div>
                            <span className="font-bold text-emerald-700">{token.tokenCode}</span>
                            <div className="text-[10px] uppercase text-slate-500 font-sans">{token.status} · KSh {token.rewardAmount}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans">No Token Yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {!token && (
                          <button
                            onClick={() => handleVerifyAcquisition(p.id, p.submittedByUserId)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
                          >
                            Verify Acquisition & Reward
                          </button>
                        )}
                        {token && token.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateReward(token.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                          >
                            Approve Reward
                          </button>
                        )}
                        {token && token.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateReward(token.id, 'PAID')}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 shadow-sm"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

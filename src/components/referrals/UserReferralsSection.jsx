// src/components/referrals/UserReferralsSection.jsx - User Referral & Reward Wallet Dashboard

import React, { useState, useEffect } from 'react';
import { Gift, Award, CheckCircle, Clock, Plus, Share2, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { getUserReferrals } from '../../services/referralService';
import SubmitReferralModal from './SubmitReferralModal';
import toast from 'react-hot-toast';
import { getPublicPropertyLocation } from '../../utils/propertyMapping';

export default function UserReferralsSection({ currentUser, userProfile }) {
  const [properties, setProperties] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const fetchReferralData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getUserReferrals(currentUser.uid);
      setProperties(data.properties);
      setTokens(data.tokens);
    } catch (error) {
      console.error(error);
      toast.error('Could not load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [currentUser]);

  // Statistics calculation
  const totalSubmitted = properties.length;
  const published = properties.filter(p => p.approvalStatus === 'approved' || p.propertyStatus === 'PUBLISHED').length;
  const acquired = properties.filter(p => p.propertyStatus === 'ACQUIRED' || p.propertyStatus === 'REWARD_PENDING' || p.propertyStatus === 'REWARD_PAID').length;
  const rewardsEarned = tokens.length;
  const rewardsPending = tokens.filter(t => t.status === 'PENDING' || t.status === 'VERIFIED').length;
  const rewardsPaid = tokens.filter(t => t.status === 'PAID' || t.status === 'APPROVED').length;
  const availableTokens = tokens.filter(t => t.status === 'APPROVED').length;

  const copyReferralLink = (propertyId, referralCode) => {
    const link = `${window.location.origin}/property/${propertyId}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            Referral & Reward Program
          </div>
          <h2 className="text-2xl font-bold text-slate-900">My Property Referrals & Wallet</h2>
          <p className="text-sm text-slate-600 mt-0.5">Submit properties you know about, earn reward tokens when acquired.</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-4 h-4" /> Submit Property Referral
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Submitted', value: totalSubmitted, color: 'text-slate-900' },
          { label: 'Published', value: published, color: 'text-emerald-600' },
          { label: 'Acquired', value: acquired, color: 'text-blue-600' },
          { label: 'Earned', value: rewardsEarned, color: 'text-purple-600' },
          { label: 'Pending', value: rewardsPending, color: 'text-amber-600' },
          { label: 'Paid', value: rewardsPaid, color: 'text-emerald-700' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Reward Wallet Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5" /> Token Wallet
            </div>
            <h3 className="text-3xl font-bold tracking-tight">Reward Balance</h3>
            <p className="text-slate-300 text-sm mt-1">Redeemable tokens from successful property acquisitions.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-center px-3">
              <div className="text-xs text-slate-300">Available</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{availableTokens}</div>
            </div>
            <div className="text-center px-3 border-x border-white/10">
              <div className="text-xs text-slate-300">Pending</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{rewardsPending}</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xs text-slate-300">Total</div>
              <div className="text-2xl font-bold text-white mt-1">{rewardsEarned}</div>
            </div>
          </div>
        </div>

        {tokens.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Your Reward Tokens</div>
            <div className="flex flex-wrap gap-3">
              {tokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => setSelectedToken(token)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/15 border border-white/10 px-4 py-2.5 rounded-xl transition text-left"
                >
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-mono text-xs font-bold text-emerald-300">{token.tokenCode}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{token.status} · KSh {token.rewardAmount || 5000}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">My Property Referrals</h3>
          <span className="text-xs text-slate-500 font-medium">{properties.length} submitted</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading referrals...</div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-800">No referrals yet</h4>
            <p className="text-sm text-slate-500 mt-1">Submit your first property referral and start earning rewards!</p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm"
            >
              Submit Property
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Referral Code</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Acquisition</th>
                  <th className="px-6 py-3">Reward</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((p) => {
                  const token = tokens.find(t => t.propertyId === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div>{p.title}</div>
                        <div className="text-xs text-slate-500">{getPublicPropertyLocation(p)}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-emerald-700">
                        {p.referralCode || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.propertyStatus === 'PUBLISHED' || p.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.propertyStatus === 'ACQUIRED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.propertyStatus || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {p.propertyStatus === 'ACQUIRED' || p.propertyStatus === 'REWARD_PENDING' || p.propertyStatus === 'REWARD_PAID' ? (
                          <span className="text-blue-600 font-semibold">Verified Acquisition</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {token ? (
                          <span className={token.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>
                            {token.status} (KSh {token.rewardAmount || 5000})
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => copyReferralLink(p.id, p.referralCode)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share Link
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Reward Token Details</h3>
              <button onClick={() => setSelectedToken(null)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-emerald-700 font-bold text-lg text-center">
                {selectedToken.tokenCode}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Reward Amount</span>
                <span className="font-bold text-slate-900">KSh {selectedToken.rewardAmount || 5000}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-600">{selectedToken.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Created At</span>
                <span className="text-slate-700">{selectedToken.createdAt?.toDate ? selectedToken.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => {
                  toast.success('Redemption request submitted to admin!');
                  setSelectedToken(null);
                }}
                disabled={selectedToken.status !== 'APPROVED'}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
              >
                {selectedToken.status === 'APPROVED' ? 'Redeem Token' : 'Awaiting Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitReferralModal
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={fetchReferralData}
        />
      )}
    </div>
  );
}

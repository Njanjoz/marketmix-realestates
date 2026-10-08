// src/pages/driver/DriverDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Clock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { listDriverOffers } from '../../services/driverService';
import DriverOfferCard from '../../components/driver/DriverOfferCard';

export default function DriverDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchOffers = async () => {
      try {
        const data = await listDriverOffers();
        setOffers(data);
      } catch (err) {
        console.error('Error listing offers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();

    // Listen to active assigned trips
    const q = query(
      collection(db, 'transportRequests'),
      where('driverId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveTrips(trips.filter(t => ['DRIVER_ASSIGNED', 'PAID', 'IN_TRANSIT'].includes(t.status)));
    });

    return () => unsub();
  }, [currentUser]);

  if (userProfile?.driverApproved !== true) {
    return (
      <main className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Driver Verification Pending</h2>
          <p className="text-xs text-slate-500 mb-6">Your driver account is currently under review by MarketMix admins. You will be able to accept moving jobs once approved.</p>
          <button
            onClick={() => navigate('/driver/onboard')}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800"
          >
            Update Onboarding Details
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              Driver Portal
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Welcome back, {userProfile?.name || 'Driver'}</h1>
            <p className="text-sm text-slate-500">Manage incoming move offers and active trips.</p>
          </div>
          <button
            onClick={() => navigate('/driver/onboard')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Driver Settings
          </button>
        </div>

        {/* Active Trips */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Active Trips ({activeTrips.length})</h2>
          {activeTrips.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white rounded-2xl p-4 border border-slate-200">No active trips right now. Accept an incoming offer below.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">{trip.status}</span>
                    <span className="text-xs font-extrabold text-emerald-700">KSh {Number(trip.quotedPrice || 0).toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate">{trip.destinationLabel || 'Trip destination'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Pickup: {trip.pickupLabel}</p>
                  <button
                    onClick={() => navigate(`/driver/trip/${trip.id}`)}
                    className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <span>Manage Trip</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Incoming Offers */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Incoming Move Offers</h2>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No pending move offers at the moment. Check back soon!
            </div>
          ) : (
            <div className="grid gap-4">
              {offers.map(offer => (
                <DriverOfferCard key={offer.id || offer.requestId} offer={offer} onActionComplete={() => listDriverOffers().then(setOffers)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

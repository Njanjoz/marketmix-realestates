import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CirclePlus, Compass, Heart, Home, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [actionsOpen, setActionsOpen] = useState(false);

  const actions = [
    { title: 'List a property', description: 'Open your dashboard to start a listing.', to: currentUser ? '/dashboard' : '/login' },
    { title: 'Create roommate profile', description: 'Meet people looking to share a home.', to: '/roommates?createProfile=1' },
    { title: 'Request a site visit', description: 'Choose a property and ask to view it.', to: location.pathname.startsWith('/property/') ? location.pathname : '/properties' },
  ];

  const items = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Explore', to: '/explore', icon: Compass },
    { label: 'Saved', to: currentUser ? '/favorites' : '/login', icon: Heart },
    { label: 'Account', to: currentUser ? '/dashboard' : '/login', icon: UserRound },
  ];

  return (
    <>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
          <Link to={items[0].to} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${location.pathname === '/' ? 'text-emerald-800' : 'text-slate-500'}`}><Home className="h-5 w-5" />Home</Link>
          <Link to={items[1].to} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${location.pathname === '/explore' ? 'text-emerald-800' : 'text-slate-500'}`}><Compass className="h-5 w-5" />Explore</Link>
          <button type="button" onClick={() => setActionsOpen(true)} aria-label="Open quick actions" className="-mt-4 mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-700 text-white shadow-lg ring-4 ring-white"><CirclePlus className="h-6 w-6" /></button>
          <Link to={items[2].to} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${location.pathname === '/favorites' ? 'text-emerald-800' : 'text-slate-500'}`}><Heart className="h-5 w-5" />Saved</Link>
          <Link to={items[3].to} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${location.pathname === '/dashboard' ? 'text-emerald-800' : 'text-slate-500'}`}><UserRound className="h-5 w-5" />Account</Link>
        </div>
      </nav>

      {actionsOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setActionsOpen(false)}>
        <section className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
          <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Quick actions</p><h2 className="mt-1 text-xl font-bold text-slate-900">What do you want to do?</h2></div><button type="button" onClick={() => setActionsOpen(false)} aria-label="Close quick actions" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
          <div className="space-y-2">{actions.map((action) => <button key={action.title} type="button" onClick={() => { setActionsOpen(false); navigate(action.to); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-emerald-300 hover:bg-emerald-50"><span className="block font-bold text-slate-900">{action.title}</span><span className="mt-1 block text-xs text-slate-600">{action.description}</span></button>)}</div>
        </section>
      </div>}
    </>
  );
};

export default MobileBottomNav;

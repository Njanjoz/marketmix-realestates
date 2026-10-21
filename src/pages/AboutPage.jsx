import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Compass, House, MapPin, ShieldCheck, Truck, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const DEFAULT_ABOUT = {
  title: 'About MarketMix',
  subtitle: 'A more practical way to find a place, make a move, and settle in.',
  story: 'MarketMix Real Estates brings property discovery and the practical steps around moving into one place. We help people explore homes, compare details, connect with listing contacts, and plan what comes next.'
};

const SERVICES = [
  { icon: House, title: 'Find a place', text: 'Explore homes, rooms, land, and commercial spaces. Narrow your search by location, price, property type, and the details that matter to you.', link: '/properties', action: 'Browse properties' },
  { icon: Building2, title: 'List and manage property', text: 'Property owners and agents can create detailed listings, add photos and location information, and manage enquiries through their account.', link: '/dashboard', action: 'Open your dashboard' },
  { icon: Truck, title: 'Plan your move', text: 'Record what needs moving, set pickup and destination areas, and request a suitable transport option with a clear trip summary.', link: '/transport', action: 'Explore transport' },
  { icon: Users, title: 'Find a roommate', text: 'People looking to share can browse roommate options and use profile details to start a more informed conversation.', link: '/roommates', action: 'Explore roommates' },
];

const PRINCIPLES = [
  { title: 'Useful details', text: 'Clear descriptions, photos, location context, and costs help people decide what to ask before arranging a viewing.' },
  { title: 'Straightforward choices', text: 'Search and filters help people compare listings. The platform should make options easier to understand, not pressure anyone to commit.' },
  { title: 'People stay in control', text: 'Ask questions, confirm the property and terms directly, and choose how to proceed. A listing or platform feature is not a substitute for your own checks.' },
];

const AboutPage = () => {
  const [aboutData, setAboutData] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    let active = true;
    getDoc(doc(db, 'settings', 'about'))
      .then((snap) => {
        if (active && snap.exists()) setAboutData((current) => ({ ...current, ...snap.data() }));
      })
      .catch((error) => console.error('Could not load About page settings:', error));
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f7f5] pb-16 pt-24 sm:pt-28">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b241a] via-[#12372a] to-[#1b4b37] text-white">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-200"><Compass className="h-4 w-4" /> MarketMix Real Estates</p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{aboutData.title || DEFAULT_ABOUT.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{aboutData.subtitle || DEFAULT_ABOUT.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/properties" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">Browse properties <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Contact our team</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-8 sm:py-16">
        <section className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Why we are here</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">Finding a place involves more than finding a listing.</h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-slate-600">
            <p>{aboutData.story || DEFAULT_ABOUT.story}</p>
            <p>People also need useful location details, a way to ask questions, time to check the terms, and practical help getting from one home to another. MarketMix brings these parts together so the next step is easier to plan.</p>
            <p>We build for renters, buyers, property owners, agents, students, roommates, and local transport providers. Each person should be able to understand what is being offered and decide whether it fits their needs.</p>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">One platform, practical steps</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">What you can do on MarketMix</h2>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {SERVICES.map(({ icon: Icon, title, text, link, action }) => (
              <article key={title} className="flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{text}</p>
                <Link to={link} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950">{action} <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-[2rem] bg-emerald-950 p-6 text-white sm:p-9 lg:grid-cols-[.7fr_1.3fr] lg:p-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">A clear path forward</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">From search to settled.</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">Use the tools that help at each stage. You choose what to do next.</p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-3">
            {[
              ['01', 'Explore', 'Search by area and compare the listing details that fit your plans.'],
              ['02', 'Ask and check', 'Contact the listing representative, ask questions, and confirm costs and terms.'],
              ['03', 'Plan your next step', 'Arrange a viewing, save useful listings, or organise transport when you are ready.'],
            ].map(([number, title, text]) => <li key={number} className="border-t border-white/20 pt-4">
              <span className="text-xs font-bold tracking-wider text-emerald-200">{number}</span>
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
            </li>)}
          </ol>
        </section>

        <section className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">What we value</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Useful information. Informed decisions.</h2>
          </div>
          <div className="space-y-3">
            {PRINCIPLES.map((principle) => <article key={principle.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div><h3 className="font-bold text-slate-950">{principle.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{principle.text}</p></div>
            </article>)}
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
              <p className="text-sm leading-6 text-amber-950"><strong>Before paying or signing:</strong> confirm the listing, representative, ownership or authority to let, viewing arrangements, and all fees directly. Review our <Link to="/terms" className="font-bold underline">Terms</Link> and <Link to="/privacy" className="font-bold underline">Privacy Policy</Link>.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div><h2 className="text-2xl font-bold text-slate-950">Start with the place you are looking for.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Browse current listings or talk with our team if you need help using the platform.</p></div>
          <Link to="/properties" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Explore properties <MapPin className="h-4 w-4" /></Link>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;

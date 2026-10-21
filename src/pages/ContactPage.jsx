import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const CONTACT_EMAIL = 'marketmixkenya@gmail.com';
const CONTACT_PHONE = '0115988107';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '', topic: 'General inquiry' });

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(formData.subject.trim());
    const body = encodeURIComponent([
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Phone: ${formData.phone || 'Not provided'}`,
      `Topic: ${formData.topic}`,
      '',
      formData.message,
    ].join('\n'));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success('Your email app should open with your message ready to send.');
  };

  const contactCards = [
    { icon: Phone, label: 'Call us', value: CONTACT_PHONE, detail: 'Speak with our team', href: `tel:${CONTACT_PHONE}` },
    { icon: Mail, label: 'Email us', value: CONTACT_EMAIL, detail: 'We usually reply within one business day', href: `mailto:${CONTACT_EMAIL}` },
    { icon: MapPin, label: 'Our home base', value: 'Nakuru, Kenya', detail: 'Proudly serving people across Kenya' },
    { icon: Clock3, label: 'Working hours', value: 'Mon–Fri, 8:00 AM–6:00 PM', detail: 'Saturday, 9:00 AM–4:00 PM · Closed Sunday' },
  ];

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10';

  return (
    <main className="min-h-screen bg-[#f5f7f5] pb-16 pt-24 sm:pt-28">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b241a] via-[#12372a] to-[#1b4b37] text-white">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-200"><MessageCircle className="h-4 w-4" /> MarketMix Real Estates</p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Let’s talk about what you need.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Questions about finding a home, listing a property, or planning a move? Our team is based in Nakuru, Kenya and ready to help.</p>
          <a href={`tel:${CONTACT_PHONE}`} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"><Phone className="h-4 w-4" /> Call our team</a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section aria-label="Contact details" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {contactCards.map(({ icon: Icon, label, value, detail, href }) => {
            const content = <>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon className="h-5 w-5" /></span>
              <span className="mt-5 block text-xs font-bold uppercase tracking-[.15em] text-slate-500">{label}</span>
              <span className="mt-2 block break-words text-lg font-bold text-slate-950">{value}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{detail}</span>
            </>;
            return href ? <a key={label} href={href} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">{content}</a>
              : <article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{content}</article>;
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Send a message</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">How can we help?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Complete the form and your email app will open with your message prepared.</p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Your name<input className={inputClass} type="text" name="name" autoComplete="name" placeholder="Full name" value={formData.name} onChange={handleChange} required /></label>
                <label className="text-sm font-semibold text-slate-700">Email address<input className={inputClass} type="email" name="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Phone number <span className="font-normal text-slate-400">(optional)</span><input className={inputClass} type="tel" name="phone" autoComplete="tel" placeholder="Your phone number" value={formData.phone} onChange={handleChange} /></label>
                <label className="text-sm font-semibold text-slate-700">What is this about?
                  <select className={inputClass} name="topic" value={formData.topic} onChange={handleChange}>
                    <option>General inquiry</option><option>Property for sale</option><option>Property for rent</option><option>Connect with an agent</option><option>Transport and moving</option><option>Technical support</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">Subject<input className={inputClass} type="text" name="subject" placeholder="How can we help?" value={formData.subject} onChange={handleChange} required /></label>
              <label className="block text-sm font-semibold text-slate-700">Message<textarea className={`${inputClass} resize-y`} name="message" rows="5" placeholder="Tell us a little more…" value={formData.message} onChange={handleChange} required /></label>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 sm:w-auto"><Send className="h-4 w-4" /> Prepare email</button>
            </form>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl bg-emerald-950 p-6 text-white sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-200"><MapPin className="h-6 w-6" /></span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Based in Nakuru</p>
              <h2 className="mt-3 text-2xl font-bold">Local roots. Kenya-wide reach.</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">MarketMix Real Estates is based in Nakuru, Kenya. We help people connect around property and moving needs in communities across the country.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Useful next steps</p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">Go straight to what you need</h2>
              <div className="mt-5 divide-y divide-slate-100">
                {[
                  ['Browse rental properties', '/properties?status=rent'],
                  ['List or manage a property', '/dashboard'],
                  ['Find an agent', '/agents'],
                  ['Plan transport', '/transport'],
                ].map(([label, to]) => <Link key={to} to={to} className="flex items-center justify-between gap-3 py-3 text-sm font-semibold text-slate-700 transition hover:text-emerald-800"><span>{label}</span><ArrowRight className="h-4 w-4 shrink-0" /></Link>)}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default ContactPage;

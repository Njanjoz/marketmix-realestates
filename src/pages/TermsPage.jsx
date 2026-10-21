import React from 'react';
import { Link } from 'react-router-dom';

const terms = [
  {
    title: 'Using MarketMix',
    body: 'MarketMix Real Estates provides online tools to discover property listings, contact agents, request viewings, and arrange transport. Property sellers must provide a recognizable landmark or location name of at least two words (for example, “Rhonda Mazembe”). A map pin may also be used for distance calculations; it does not replace the written location name. Listings and provider information are supplied by third parties. Check important details directly with the owner or provider before paying or making a decision. Unless a booking page says otherwise, MarketMix is not the landlord, seller, agent, or transport provider and does not itself promise that a listing is available or that a transaction will be completed.',
  },
  {
    title: 'Bookings, fees, and payments',
    body: 'Review the service, total price, fee, refund terms, and provider details shown before confirming a booking or payment. Any non-refundable fee applies only when it was clearly disclosed before you paid and to the extent permitted by Kenyan law. A payment is confirmed only after the payment provider confirms it. Keep your booking reference and payment receipt.',
  },
  {
    title: 'Location names and map pins',
    body: 'Sellers must provide a recognizable landmark or location name of at least two words (for example, “Rhonda Mazembe”). A map pin is stored separately and may be used for distance calculations; it does not replace the written location name. Moving customers must provide recognizable pickup and destination names. Trip distance is estimated from the map pins, while the names help the assigned driver identify the pickup and destination.',
  },
  {
    title: 'Property tours, cancellations, and refunds',
    body: <><p>Site-seeing payments include a vacancy-check fee and, where selected, a viewing-package fee. You can request cancellation and a refund for either eligible paid site-seeing payment from My Bookings.</p><p><strong>Standard cancellation deadline: submit at least 24 hours before the exact scheduled viewing date and time (East Africa Time). The countdown on each payment updates automatically.</strong> Requests made after that deadline, after a missed visit, or after a visit has started are reviewed case by case. If no viewing time has been confirmed, submit your request as soon as possible.</p><p><strong>For an approved customer-requested refund, the estimate deducts 5% platform maintenance (rounded to the nearest shilling) plus the configured M-Pesa withdrawal fee.</strong> The withdrawal fee is based on the balance after the maintenance deduction:</p><ul className="my-2 list-disc space-y-1 pl-6"><li><strong>KSh 100 or less: KSh 10</strong></li><li><strong>KSh 101–1,000: KSh 20</strong></li><li><strong>KSh 1,001–3,000: KSh 30</strong></li><li><strong>KSh 3,001–5,000: KSh 50</strong></li><li><strong>KSh 5,001–80,000: KSh 100</strong></li><li><strong>KSh 80,001–120,000: KSh 500</strong></li><li><strong>Above KSh 120,000: KSh 1,000</strong></li></ul><p>The amount shown before submission is an estimate and the administrator reviews every request before payout. If deductions leave no positive payout, contact support for review.</p><p><strong>If MarketMix or the provider cancels or cannot deliver the paid service, you may choose rescheduling or a refund without these deductions.</strong> This policy does not remove any refund or cancellation right provided by Kenyan law; where the law requires a full refund, no deduction will be made. M-Pesa processing time after payout initiation depends on the payment provider. Contact us with your booking and M-Pesa references if you need help.</p></>,
  },
  {
    title: 'Tour providers and scheduling',
    body: 'MarketMix coordinates tour requests with property agents and other providers. The provider must confirm the appointment and access arrangements. Travel, accommodation, or other costs are included only when the package expressly says so. Tell us promptly if the scheduled tour changes or you cannot reach the provider.',
  },
  {
    title: 'Moving quotes, driver assignment, and payment',
    body: <><p>Moving fares may be quoted by an approved driver or by MarketMix admin when automatic matching cannot find a suitable driver. An admin quote may be a fixed trip price or a per-kilometre rate; the route distance, rate basis, assigned driver and total fare are shown for your review. A per-kilometre quote is calculated using the displayed route estimate and does not change unless you agree to a revised quote before booking.</p><p>You choose whether to accept the quote. After acceptance, use the booking and payment link to review the fare and pay through the available M-Pesa checkout. Do not pay a driver directly for a trip already paid through MarketMix unless MarketMix support confirms the arrangement. The trip is not confirmed as paid until the payment provider confirms settlement.</p><p>For online-paid moves, MarketMix deducts an <strong>8% platform commission from the quoted trip fare</strong>. The supplied tiered withdrawal charge is then applied to the balance after that commission and deducted from the driver's payout. For example, for a KSh 1,000 fare, commission is KSh 80, the payout balance before withdrawal is KSh 920, the applicable charge is KSh 20, and the driver payout is KSh 900. Applicable payment-provider collection charges may also be incurred; the payment total and any customer charge are shown before checkout. MarketMix does not add an undisclosed charge to your accepted quote.</p><ul className="my-2 list-disc space-y-1 pl-6"><li><strong>KSh 100 or less: KSh 10</strong></li><li><strong>KSh 101–1,000: KSh 20</strong></li><li><strong>KSh 1,001–3,000: KSh 30</strong></li><li><strong>KSh 3,001–5,000: KSh 50</strong></li><li><strong>KSh 5,001–80,000: KSh 100</strong></li><li><strong>KSh 80,001–120,000: KSh 500</strong></li><li><strong>Above KSh 120,000: KSh 1,000</strong></li></ul><p>Withdrawal charge tiers apply to driver payouts and are separate from the property-viewing refund rules above. If MarketMix or the assigned driver cancels or cannot provide a paid trip, contact support for rescheduling or a refund review. Applicable consumer rights remain unaffected.</p></>,
  },
  {
    title: 'Your responsibilities',
    body: 'Provide accurate account and booking details, use the service lawfully, and do not post misleading listings or misuse another person’s information. Contact the relevant provider to confirm arrangements and promptly tell us about suspected fraud, an incorrect charge, or a safety concern.',
  },
  {
    title: 'Complaints and legal rights',
    body: 'Please contact us first with the relevant listing, booking, or payment reference so we can review the issue. This request for contact does not prevent you from making a complaint to a regulator or bringing a claim before a court or tribunal with jurisdiction. These terms are governed by the laws of Kenya. Nothing here excludes or limits a right or remedy that cannot lawfully be excluded or limited, including applicable consumer rights and access to justice.',
  },
  {
    title: 'Changes and contact',
    body: 'We may update these terms when the service or law changes. The revision date below identifies the current version. For questions or complaints, use our Contact page and keep a copy of your message and any reference number.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix · Terms</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-500">Updated 20 October 2026</p>
        <p className="mt-6 text-sm leading-7 text-slate-700">These short terms apply when you use MarketMix Real Estates. Please also review our <Link className="font-bold text-emerald-800 underline" to="/privacy">Privacy Policy</Link> and <Link className="font-bold text-emerald-800 underline" to="/cookies">Cookie Notice</Link>.</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
          {terms.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
              {typeof body === 'string' ? <p className="mt-2">{body}</p> : <div className="mt-2 space-y-3">{body}</div>}
            </section>
          ))}
          <p className="border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">These terms are general service information, not a substitute for advice about your specific circumstances.</p>
          <p className="text-sm">Contact us through the <Link className="font-bold text-emerald-800 underline" to="/contact">MarketMix contact page</Link>.</p>
        </div>
      </article>
    </main>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  ['Information we handle', 'Depending on how you use MarketMix, we may handle account and contact details, property listings, enquiries, booking and payment references, messages to support, and basic technical information needed to operate and secure the service. Please do not send sensitive personal information unless it is needed for your request.'],
  ['Why we use it', 'We use information to provide accounts, listings, enquiries, bookings, payment updates, customer support, service security, and necessary records. We may also use limited usage information to maintain and improve the service.'],
  ['Property-tour bookings and campaign counts', 'For a tour booking, we handle the participant name and contact details, selected package and properties, preferred visit time, booking status, and payment references so we can coordinate with the relevant agent and payment provider. We may show an aggregate number of registrations for a public tour campaign. We do not display individual participants’ names or phone numbers in that public count.'],
  ['Moving requests and manual driver matching', 'For a moving request, we use the customer’s contact details, pickup and destination labels and map coordinates, requested vehicle, and item list to match a driver and coordinate the trip. If no suitable automatic match is found, MarketMix admin receives the request details and contact details for the closest approved drivers. Admin may contact a suggested driver, assign that driver, set a fixed or per-kilometre quote, and send the quote and booking link to the customer. Relevant trip details and customer contact information are shared with the assigned driver after assignment so the parties can confirm availability and complete the move. We retain the quote, assignment, payment and payout records for operations, support, accounting, dispute handling, and security.'],
  ['Who may receive it', 'We share relevant information with the agent, landlord, driver, or other provider involved in a service you request, and with payment, hosting, communications, and security providers that help us operate the service. For an M-Pesa STK Push, we send the payment provider the phone number, amount, transaction reference, and name needed to process the payment. We receive payment status, provider reference, and charge details for our transaction records. We may disclose information when required by law or necessary to protect people or the service. We do not sell personal information.'],
  ['Refunds and M-Pesa withdrawal fees', <><p>When you request a site-seeing refund, we use the booking and payment reference, amount paid, scheduled viewing time, and M-Pesa contact details to review the request and process an approved payout. The refund calculation may include <strong>5% platform maintenance</strong> (rounded to the nearest shilling) and the withdrawal fee shown in our <Link className="font-bold text-emerald-800 underline" to="/terms">Terms of Service</Link>. The withdrawal fee is calculated from the balance after maintenance:</p><ul className="my-2 list-disc space-y-1 pl-6"><li><strong>KSh 100 or less: KSh 10</strong></li><li><strong>KSh 101–1,000: KSh 20</strong></li><li><strong>KSh 1,001–3,000: KSh 30</strong></li><li><strong>KSh 3,001–5,000: KSh 50</strong></li><li><strong>KSh 5,001–80,000: KSh 100</strong></li><li><strong>KSh 80,001–120,000: KSh 500</strong></li><li><strong>Above KSh 120,000: KSh 1,000</strong></li></ul><p>For online moving jobs, the payout record also includes the 8% MarketMix commission and the applicable withdrawal charge calculated on the balance after commission. We share the payee phone number and approved net payout amount with the payment provider to make a payout, and retain the request, fee calculation, and payout status for support, accounting, security, and legal recordkeeping.</p></>],
  ['Location names and map pins', 'Property sellers provide a human-readable landmark or location name of at least two words. Map coordinates are stored separately and may be used to calculate distance or show approximate location. For moving requests, pickup and destination names and map pins are used to match drivers, estimate trip distance, and coordinate the move. If automatic matching finds no suitable driver, MarketMix admin may receive the request and customer contact details and contact potential drivers. Assigned drivers receive relevant landmark names and trip details. Exact map coordinates are not included in WhatsApp quote notices.'],
  ['Retention and security', 'We keep information for as long as reasonably needed for the purposes above, including transaction records, legal obligations, dispute resolution, and security. We use reasonable safeguards; no internet service can promise absolute security.'],
  ['Your choices and rights', 'You can update available account details and ask us about access to, correction of, or deletion of your personal information. You may also object to or ask about how information is used, subject to applicable law and records we are required to retain. Where processing relies on consent, you may withdraw it. You may complain to the Office of the Data Protection Commissioner in Kenya.'],
  ['Children and updates', 'The service is not intended for children to make accounts, bookings, or payments without appropriate adult involvement. We may revise this notice as our services or legal obligations change; the date below shows the latest revision.'],
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix · Privacy</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Updated 20 October 2026</p>
        <p className="mt-6 text-sm leading-7 text-slate-700">This notice explains how MarketMix Real Estates handles personal information when you use the app, website, and related services.</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
              {typeof body === 'string' ? <p className="mt-2">{body}</p> : <div className="mt-2 space-y-3">{body}</div>}
            </section>
          ))}
          <section>
            <h2 className="text-lg font-extrabold text-slate-950">Contact and requests</h2>
            <p className="mt-2">To ask a privacy question or make a request, contact us through the <Link className="font-bold text-emerald-800 underline" to="/contact">Contact page</Link>. Include enough information for us to identify your account or request, but do not send passwords or payment card details.</p>
          </section>
          <p className="border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">This notice describes our current practices and does not limit rights provided by applicable data protection law.</p>
        </div>
      </article>
    </main>
  );
}

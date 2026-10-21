# MarketMix launch review

## Transport online payments (added section)

- The moving API has isolated IntaSend routes under `/api/moving/payments/*`; existing property payment and WhatsApp routes are unchanged.
- Configure the web app's `VITE_MOVING_BACKEND_URL` to the moving API's HTTPS Render URL. Configure that API with `INTASEND_SECRET_KEY` and `INTASEND_WEBHOOK_CHALLENGE`.
- In IntaSend, register the moving API webhook URL `/api/moving/payments/intasend-webhook` for `collection_event` and `/api/moving/payments/payout-webhook` for `send_money_event`, using the exact same challenge value.
- The driver must opt in on Driver Onboarding. Quote acceptance queues a WhatsApp to the assigned driver, and online M-Pesa checkout only appears when that driver has opted in.
- A confirmed paid move earns the driver 92% of the accepted quote. Once it is marked delivered, the driver can request withdrawal; an administrator reviews it in Admin → Moving requests → Transport withdrawals. Approving starts an IntaSend MPESA-B2C transfer; payout status is confirmed by the webhook.
- Before production, verify the IntaSend merchant account is approved for STK collection and M-Pesa B2C disbursement, has enough KES balance, and the sender has permission to initiate payouts. No live transfer or WhatsApp was sent as part of this code change.

Review date: 19 October 2026

## What the website does

- Buyers can browse and filter approved property listings, view listing details, save favorites, contact sellers, and request viewings.
- Roommates is a real matching/profile flow at `/roommates` (it shares the Explore page); Urban Nest filters listings marked as short stays.
- Moving lets a customer describe items, choose a vehicle, enter pickup/destination, request a quote, and track a trip. The backend dispatches requests to matching drivers and has a no-capacity path for admin follow-up.
- Drivers can register their vehicle, service area, and carrying capacity, then review offers and active trips.
- Guided site-seeing packages, agent listings, mortgage estimates, seller/agent dashboards, admin moderation, messages, and receipts are also present.

## Booking and WhatsApp path

- A property site visit is written to Firestore `siteVisits`. A guided site-seeing request is written to `sightseeingBookings`. Moving requests are written to `transportRequests` and dispatched by the backend.
- Viewing booking writes previously had no matching Firestore rules, so authenticated writes/reads could fail with permission denied. Rules now allow the customer, listing owner, and admin to access the booking. Site-seeing booking now requires sign-in and has the same access boundary.
- Both property viewing flows now attempt WhatsApp messages to the customer and listing contact after saving. Messages call the existing `/api/whatsapp/notify` endpoint. The UI warns if a phone is missing or the server does not accept a notification; this means “queued” is not a guarantee that WhatsApp delivered it.
- The existing transport flow sends a customer confirmation and uses backend driver dispatch. Notification delivery still depends on the Render WhatsApp provider configuration, valid Kenyan phone numbers, and server availability.

## Launch risks to close

1. Publish the updated `firestore.rules` to the Firebase project. A code change in this repository does not publish rules by itself.
2. Confirm Render's WhatsApp credentials, sender/template approval where applicable, allowed website origins, and admin contact configuration. Run a real booking with both customer and listing-owner numbers and verify both phones receive it.
3. The current `/api/whatsapp/notify` endpoint accepts arbitrary phone numbers and message bodies without authentication. Add backend authentication, rate limits, and booking-ID-based recipient lookup before promoting it publicly; otherwise it can be abused to send messages through the business account.
4. Sight-seeing package requests currently record `paymentStatus: pending`; the existing M-Pesa callback does not complete this package flow. Tell customers clearly when payment is due and add a payment/callback path before collecting package fees online.
5. The Android build now targets a signed release APK and reads signing credentials from `ANDROID_RELEASE_STORE_FILE`, `ANDROID_RELEASE_STORE_PASSWORD`, `ANDROID_RELEASE_KEY_ALIAS`, and `ANDROID_RELEASE_KEY_PASSWORD`. No release keystore is configured in this workspace, so create and safely retain one before running the build. Keep the same key for future app updates.
6. The website download link now targets `public/MarketMix-RealEstates.apk`. Build the signed release APK and deploy the updated site before the link will work. No live deployment has been performed.
7. Large initial JavaScript chunk (about 808 kB minified) and an old Browserslist dataset were reported by the production build. Split the heaviest dashboard/vendor chunk and refresh the dataset before optimizing load time.
8. The root README is the stock Vite starter guide, so operators have no project-specific release, support, or recovery instructions.

## Business models grounded in current features

- Charge sellers/agents for verified, featured, or higher-volume property listings; keep basic listings free to seed supply.
- Earn a disclosed service fee on completed moving jobs, or offer driver subscriptions for qualified leads. Keep quoted transport prices separate from the platform fee.
- Sell optional paid viewing assistance and property-hunt packages; show exactly what is included and make payment status explicit before confirming a booking.
- Offer paid listing photography, verification, and tenant/landlord screening as add-ons.
- Use referral rewards only after a verified paid transaction. Do not award credits solely for a client-side booking event.

## Before public launch

Deploy Firestore rules, verify WhatsApp delivery end to end, configure production APK signing, publish the signed APK, and test web plus Android flows on real devices. Keep a named release owner and rollback copy of the current web build/server configuration.

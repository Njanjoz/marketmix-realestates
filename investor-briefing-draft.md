# MarketMix Real Estate
## Investor and Stakeholder Briefing

**Product, operating model, user guide, and diligence pack**  
Prepared from the MarketMix Real Estates website and repository code snapshot  
**Review date: 20 October 2026**

> **Important:** This is a product briefing, not a securities offer, legal opinion, audited financial statement, or guarantee of availability. It describes code and visible product flows reviewed on the date above. Production configuration, service availability, prices, partner contracts, regulatory obligations, and commercial results require independent confirmation. No user, listing, booking, revenue, growth, or return figures are asserted here unless explicitly marked as a code default or demonstration value.

\newpage
# Contents and reading guide

This briefing is organized as a 45-part book. The opening sections explain the product and its investment story. The middle sections guide buyers, tenants, landlords, agents, investors, drivers, and campaign organizers through the product. The final sections cover operations, technology, trust, risks, roadmap, diligence, and a pitch narrative.

Use the role-specific chapters as practical onboarding material. Use the investor chapters as a discussion framework, not as a substitute for validated operating data. Where a feature appears in source code, it is described as implemented in the reviewed code path; that does not establish that it is enabled, error-free, or deployed in production. Where a figure is called a default, administrator settings may change it.

**Evidence labels used throughout**

- **Code-backed flow:** visible in the reviewed application or backend source.
- **Configurable:** controlled by Firebase settings, environment variables, or administrator setup.
- **Demo / illustrative:** sample values or simulated calculations; never use as traction or financial performance.
- **Needs verification:** confirm against the live website, production database, provider contracts, or professional advice.

\newpage
# 1. Executive overview

MarketMix Real Estate is a web product intended to help people discover properties and coordinate the steps around a move or viewing. Its website combines property search and detail pages with role-based workspaces for buyers, landlords, agents, drivers, investors, and administrators. Related flows include property inquiries, viewing coordination, paid viewing or search packages, transport requests, and event-style property campaigns.

The product proposition is broader than a static listing directory: it attempts to connect discovery to action. A prospective tenant can find a listing, contact the relevant party, request a viewing, and potentially arrange transport. A landlord or agent can publish a listing for review and manage leads. Administrators can moderate content and coordinate service workflows.

For investors, the credible story today is the breadth of the product workflow and the opportunity to validate a focused marketplace in Kenya. The repository alone does not establish market share, user growth, revenue, conversion, retention, or unit economics. The investor dashboard includes simulated figures and must not be presented as actual portfolio performance.

The next value-creation step is operational proof: verified supply, response times, successful viewings, completed moves, repeat usage, customer satisfaction, and contribution margin by service. This document explains what the product is designed to do, what the code snapshot shows, and what evidence is needed before making commercial claims.

\newpage
# 2. The company and product boundary

MarketMix is a multi-service brand. The real-estate website is one part of a wider ecosystem that also has marketplace, moving, and communications code. This briefing focuses on the real-estate experience and the services directly connected to property discovery, viewings, and transport.

The codebase shows integrations with Firebase Authentication and Firestore, an Express API, IntaSend payment initiation, and a media-upload path that references Cloudflare tooling. Their presence in code is not proof of a current vendor agreement, production uptime, data-processing terms, or successful end-to-end operation. Those are diligence questions.

The website exposes public information pages such as About, Contact, Terms, Privacy, and Cookies, alongside property and service pages. Authenticated user areas provide booking, messaging, favorites, profile, and role-specific workflows. Admin areas support operational management. Access is role-aware; admin privileges are not intended to be self-selected through ordinary registration.

Investors should evaluate the real-estate business on its own service scope, economics, and customer outcomes. Cross-selling from other MarketMix products may be a future advantage, but it should be treated as a hypothesis until measured with attributable customer journeys and incremental revenue.

\newpage
# 3. The customer problem

Property search is fragmented. A person may find a listing on one channel, ask questions in another, arrange a viewing by phone, then solve transport independently. Information quality and availability can vary, and coordinating multiple properties can consume time and money.

Landlords and agents face a different set of frictions: creating a useful listing, supplying credible photos and details, responding to inquiries promptly, arranging access, and distinguishing serious prospects from low-intent contacts. Smaller operators may lack a central system for lead handling and follow-up.

Moving adds another coordination problem. A renter who has found a home may still need a vehicle, a quote, and a driver whose capacity fits the move. A platform that links discovery and logistics could reduce handoffs, provided that inventory, response quality, pricing, and service reliability are strong.

These are problem statements, not quantified market findings. The company should validate them through customer interviews and observed workflow data: time to find a suitable property, inquiry-to-response time, viewing attendance, move completion, and the proportion of users who would otherwise have abandoned or used a competing service.

\newpage
# 4. The product response

The product responds with a connected set of digital tools: searchable property inventory; property detail pages; account roles; listing submission and review; favorites and inquiries; viewing and booking workflows; transport requests; campaign pages; and administrative operations.

The intended customer path is straightforward: discover, assess, ask, schedule, attend, and move. Each step creates a chance to improve trust and reduce effort. A useful property page should let a customer understand the price, location, category, facilities, media, and next action. A useful service workflow should make status and responsibility visible.

The product also creates a structured operating layer. Listings, users, inquiries, bookings, campaign registrations, and transport requests can be represented as records rather than scattered conversations. This creates a foundation for service measurement and follow-up, subject to sound data governance and operational discipline.

The main execution challenge is not adding screens. It is making each handoff dependable: accurate listings, fast replies, confirmed access, transparent charges, functioning payment confirmation, safe transport coordination, and clear remedies when a service fails.

\newpage
# 5. Product map

The public website includes a home page, property catalog and detail routes, agent directory, luxury/exploration pages, roommate discovery entry, transport, site-seeing, campaign registration, mortgage information, contact, About, and legal pages. Some routes redirect to newer paths or share a component, so the navigation should be checked against the deployed site before a public pitch.

Signed-in areas include bookings, profile, favorites, messages, notifications, settings, help, and dashboards. Agent functions include listing and lead-related tools, viewing details, and availability. Driver functions include onboarding, approval, dashboard, and trip workflows. Admin workspaces cover property review, users, campaign management, packages, service requests, transport requests, viewing bookings, and customer support.

The site is therefore both a consumer-facing marketplace and an operations console. This architecture may support a coherent service, but it also increases product and support complexity. A pitch should explain which workflows are live and actively operated today, which are available only to selected roles, and which are experiments.

For a demonstration, prepare separate journeys for a buyer, a landlord, and an operations administrator. Avoid clicking into dashboard cards with sample data unless they are clearly labeled as demo.

\newpage
# 6. Customer segments and value

**Renters and buyers** need relevant inventory, enough detail to compare options, timely replies, and a convenient route to view a property. **Landlords** need qualified leads, control over listing details, and clarity about who is handling each inquiry. **Agents** need visibility into assigned properties, lead status, viewing schedules, and reliable communication.

**Investors** need a clear distinction between investment education or property discovery and any actual investment transaction. **Drivers** need transparent trip details, fair quoting, and a workable dispatch flow. **Campaign organizers** need event information, registration, attendance coordination, and accurate counts. **Administrators** need tools to moderate supply and resolve problems.

The platform’s value should be measured separately for each group. For renters, compare time and effort saved. For landlords, compare qualified leads and vacancy time. For agents, compare lead conversion and appointment attendance. For drivers, compare completed paid jobs and idle time. For administrators, compare resolution time and preventable incident rates.

Do not assume that all segments should be launched or monetized at once. Early marketplace focus can be stronger when a defined geography and property category have enough supply and response capacity to create a dependable experience.

\newpage
# 7. The home page and discovery

The home experience presents property discovery and promotional placements. Source code supports approved property listings and administrator-managed placements such as featured, hero, or trending inventory. Campaign modules may also be shown. This creates room to balance organic relevance with paid or sponsored placement, if any such commercial policy is adopted and disclosed.

Some homepage source defaults contain large headline statistics, such as property or satisfaction counts. These are sample marketing values in code and are **not verified company metrics**. Remove them or replace them with substantiated, date-stamped evidence before showing the site to investors or customers.

Discovery should help a user narrow choices without implying that every listing is current or independently verified. Search, category filters, location, price, and property detail are useful only when the underlying data is complete and regularly maintained.

Recommended user practice: open several comparable listings, confirm the current price and availability directly, and record the date and source of any material claim. Recommended product practice: show when a listing was last confirmed, give users an easy way to report an issue, and prevent expired inventory from continuing to appear as available.

\newpage
# 8. Property categories and inventory

The codebase supports residential and broader property categories, including apartments, houses, student housing, commercial property, land, and short-stay/UrbanNest-style inventory. Actual category availability depends on what has been published and approved in the production database.

A listing can carry price, location, description, amenities, images, and other structured details. Seller workflows include staged editing, location and transport information, media, and a YouTube walkthrough field. The product can therefore represent more than a headline and a phone number, but data completeness remains an operating responsibility.

Investors should request a de-identified inventory export showing listing status, category, area, age, last verification date, media completeness, duplicates, and inquiry activity. A count of database records is not necessarily a count of available, unique, current properties.

For landlords and agents, accurate inventory protects reputation. Update rent, deposit, availability, viewing instructions, and amenities as soon as they change. Never upload images or descriptions that misrepresent a property or that you do not have permission to use.

\newpage
# 9. Search and comparison

The public product includes property browsing and detail routes, with search and filtering intended to help users compare options. A strong search experience should preserve filters, offer sensible empty states, work on mobile, and explain why a listing appears. Search quality depends on normalized locations, complete fields, and active inventory.

Users can compare more than price: commute, household size, furnishing, accessibility, utilities, security arrangements, lease terms, and viewing availability may matter. The site should not imply that every detail is independently inspected. Users should confirm contract terms and property condition before paying a deposit or signing.

For the business, search analytics can reveal underserved locations and categories. Useful measures include zero-result searches, search-to-detail rate, detail-to-inquiry rate, filters most used, and the percentage of viewed listings that remain available. These measures should be calculated from real events and checked for duplicate or bot traffic.

For a pitch, show a real search journey on a small, verified sample of listings. Do not use a prototype screenshot as evidence of inventory depth, and do not substitute page views for qualified demand.

\newpage
# 10. Property detail and trust

Property detail pages are the point where a user decides whether a listing is worth pursuing. The reviewed product supports property media, description, price, location, amenities, and contact or viewing actions. The quality standard should be consistent across every listing.

Trust features to establish include identity of the person authorized to list, last confirmation of availability, photo provenance, clear rent and deposit, fee disclosure, viewing arrangements, and a route to report fraud or incorrect information. Any verification badge must have a defined process and a visible meaning.

The code includes a public property collection and a protected-data collection. This suggests an architecture that can keep some sensitive fields separate, but actual access rules and deployed security configuration need independent review. Never treat a UI restriction as a security control by itself.

Users should not send money to an unverified person solely because a listing appears on the website. Confirm ownership or authority, inspect the property, obtain written terms, and use a traceable payment method. The platform should publish clear limits on what it verifies and what it does not.

\newpage
# 11. Buyer and tenant journey

1. Browse or search for the relevant property category and area. 2. Open a listing and check availability, price, location, photographs, facilities, and contact details. 3. Save the property or send an inquiry. 4. Agree on a viewing date and time with the responsible agent or landlord. 5. Attend and inspect the home. 6. Confirm terms and payment details directly through the documented process. 7. If moving, request transport separately and confirm the vehicle, quote, and timing.

The website includes favorites, messages, notifications, profile, booking, and help areas for authenticated users. Their availability may depend on account role and production configuration. Keep a copy of relevant communications and receipts.

If an inquiry receives no response, use the site’s support/contact route and provide the listing URL, inquiry date, and preferred contact method. Do not share bank credentials, one-time passwords, or identity documents through an informal chat.

This guide describes the intended product journey. A user should confirm the final live steps, particularly payment destination, cancellation terms, and the distinction between a viewing service fee and a property deposit.

\newpage
# 12. Landlord journey

Landlords can register under a seller/landlord role and submit property details for review. The form supports staged property editing, images and walkthrough media, and location information. Public display is tied to approval states in the reviewed code, giving administrators a moderation point before a listing is presented as published.

Prepare the listing before submission: accurate title, category, rent or price, deposit and recurring charges, availability date, location, room dimensions where practical, amenities, utility arrangements, lease duration, viewing instructions, and clear photographs. State whether the listing is furnished and disclose material restrictions.

After publication, check and answer inquiries regularly. Mark the property unavailable immediately when a lease is signed or the property is withdrawn. Coordinate viewing access safely and keep an auditable record of any agreed terms.

The product’s value to landlords will depend on lead quality and conversion, not just listing exposure. Track inquiries, qualified prospects, viewing attendance, time to let, and support issues. Ask MarketMix to explain any listing, promotion, or service fees before purchasing them.

\newpage
# 13. Listing standards and moderation

Moderation is both a trust function and a supply-quality control. The admin workspace includes property review. A repeatable review policy should check listing authority, duplicate records, prohibited content, misleading prices, photo rights, discriminatory language, stale availability, and appropriate handling of sensitive personal information.

Use defined statuses: draft, submitted, needs changes, approved, rejected, paused, and expired. Record who reviewed a listing and when. A landlord should know what to correct and how to appeal a mistaken rejection. A user should be able to report a listing that appears fraudulent or unavailable.

Automation can identify duplicates or suspicious patterns, but high-impact decisions should have human review and an appeal path. Measure review turnaround and reversal rates so moderation does not silently suppress legitimate supply.

Before scaling acquisition, set minimum listing requirements and build a process to re-confirm availability. A marketplace with many stale properties will lose trust faster than a smaller marketplace with accurate, responsive inventory.

\newpage
# 14. Agent workflow

Agents can register and manage a role-specific workspace. The reviewed routes include agent viewing details and availability functions, alongside listing, inquiry, and appointment-related tools. Admin controls can review users and roles. Exact assignment rules and live coverage should be checked in production.

An agent’s operating routine should include acknowledging new leads, confirming authority to show the property, offering realistic viewing slots, sharing accurate directions, updating the outcome, and escalating concerns. Record the next action so a lead does not disappear in a personal chat history.

The platform should make ownership of a lead clear. If multiple agents can respond, define assignment, response-time expectations, reassignment, and dispute handling. Track appointment confirmation, attendance, no-show reason, and whether the customer found a suitable property.

Agent earnings or balance displays should be treated as product records that require reconciliation. The presence of a withdrawal-request interface does not prove funds have been paid. Investors should inspect payout logs, approvals, fees, reversal handling, and settlement evidence.

\newpage
# 15. Viewing and site-seeing service

The site includes site-seeing package and booking flows. The code supports authenticated checkout, selection of properties in certain packages, preferred viewing date/time for direct or completion booking modes, payment initiation, and payment-status polling. Providers or agents may participate in coordination.

Code defaults include package amounts such as KSh 100 for quick view, KSh 250 for assisted view, KSh 300 for student hunt, KSh 500 for property hunt, KSh 1,000 for premium hunt, and KSh 150 for group viewing. These are **defaults in source code only**. Administrator settings can override them; confirm the actual live price and inclusions before quoting a customer.

The source also includes a KSh 50 vacancy-check fee default and a KSh 25 agent availability earning value. Treat these as configuration defaults requiring reconciliation against current policy and actual payment records. They are not evidence of revenue or agent payouts.

An unusual date validation in the reviewed code may require a viewing date at least 24 days ahead for certain booking modes. Confirm whether this is intentional and what the deployed experience currently enforces before promising short-notice bookings.

\newpage
# 16. Booking and payment lifecycle

The booking service initiates M-Pesa STK push through IntaSend and polls for payment status on the client, with a bounded polling period in the reviewed code. Backend callbacks update payment records and related booking state. A customer should receive a clear result when payment succeeds, fails, or remains uncertain.

The production experience must be tested for duplicate callbacks, late callbacks, amount mismatches, retry behavior, network interruptions, and refund reconciliation. A customer should not be charged twice because they retried after a slow screen. Each transaction needs a stable reference and an auditable link to the booking or service.

Before taking payment, show the amount, what it buys, whether it is refundable, who provides the service, and how to get help. Keep a receipt and payment status visible. Do not describe a viewing coordination fee as a property deposit or rent.

Investors should reconcile IntaSend settlement reports to internal records and bank/mobile-money statements. Source code can initiate a payment; only reconciled settlement data can establish cash received and net proceeds.

\newpage
# 17. Cancellation and refunds

The reviewed user interface and backend implement a refund-request path associated with bookings. The timing rule is based on the scheduled viewing date and time in East Africa Time; the My Bookings screen refreshes its countdown periodically. Late requests can be submitted for case-by-case review according to the code’s described handling.

For customer-requested refunds, code calculates a 5% maintenance deduction, rounded to the nearest shilling, and then applies a configured tiered payout fee to the remaining amount. The schedule visible in the reviewed implementation is: balance up to KSh 100, KSh 10; up to KSh 1,000, KSh 20; up to KSh 3,000, KSh 30; up to KSh 5,000, KSh 50; up to KSh 80,000, KSh 100; up to KSh 120,000, KSh 500; above KSh 120,000, KSh 1,000.

This is a MarketMix-configured calculation in code; do not describe it as IntaSend’s tariff. Confirm the current live terms, merchant agreement, and actual payout costs. The code/terms indicate that some full-refund cases, including provider cancellation or applicable statutory requirements, should not incur these customer-requested deductions. Have counsel review the complete policy and consumer disclosures.

Show the calculation before submission, explain review timing, provide a case reference, and record approval, payout, failure, and appeal outcomes. A request marked approved is not proof that cash has been returned.

\newpage
# 18. Transport and moving service

The transport product lets a customer describe items, pickup and destination, select a vehicle or service option, receive or discuss a quote, and coordinate a driver. The source includes driver onboarding and an approval state, trip dashboards, status updates, and live location-related functions.

When there is no driver in the immediate area, the reviewed backend contains a fallback that searches approved drivers more broadly and selects a closest candidate based on pickup distance. It can create an administrator alert with driver contact and vehicle details for follow-up. This is an operational fallback, not a guarantee that a driver is available, willing, licensed, or able to accept the job.

Confirm quote scope, item capacity, access constraints, waiting time, cancellation, payment timing, insurance, damage process, and driver identity before dispatch. The user should be able to see whether a request is only submitted, quoted, accepted, paid, assigned, en route, completed, or cancelled.

Code shows an 8% transport commission in the relevant payout path. Confirm the live commercial policy, its calculation base, tax handling, refunds, driver settlements, and whether the feature is enabled. Do not project this commission as revenue without transaction-level evidence.

\newpage
# 19. Driver onboarding and safety

Drivers can enter an onboarding flow and use a driver dashboard after administrative approval. The backend stores driver details and supports approval or rejection, including a reason. A role may exist in an account while the driver is still pending review; access should be granted only after checks are complete.

Before activating drivers, define identity, licence, vehicle, insurance, capacity, safety, conduct, service-area, and document-expiry checks. Establish a process for complaints, accidents, lost items, harassment, and emergency escalation. Explain what information is shared with the customer and how location is used.

Live location should be collected only for a clear operational purpose, at appropriate times, with user-facing disclosure and access controls. Retain it only as long as needed for service, safety, dispute, or legal requirements. Review vendor and Firebase access controls.

Drivers should see the trip scope and agreed payout before acceptance. The dispatch team should be able to intervene when capacity or timing is unsuitable. A “closest driver” ranking should never substitute for availability confirmation or safety checks.

\newpage
# 20. Visit campaigns and group events

The codebase includes visit campaigns with an administrator-managed event page, media, location, date, duration, package inclusions, registrations, and payment-related flows. Live paid registration counts can be combined with manual or offline registration counts. Campaigns may be presented on the home page.

This can support coordinated property tours or group viewing events. It may help users inspect multiple properties in a planned session and help landlords or agents reach a concentrated audience. The model needs clear event capacity, arrival instructions, refunds, accessibility, safety, and organizer responsibilities.

Registration counts must distinguish paid, pending, cancelled, offline-entered, refunded, and attended participants. Manual adjustments should record who changed the count and why. Avoid advertising scarcity or “sold out” status from an unverified aggregate.

Before pitching campaign economics, collect actual cost per attendee, attendance rate, number of qualified leads, completed viewings, landlord participation, and conversion to a lease or sale. A paid registration is not automatically a successful property transaction.

\newpage
# 21. Investor-facing features and demo data

The site exposes an investor-oriented dashboard route. The reviewed implementation includes hard-coded or simulated values, such as sample percentage returns, portfolio valuations, positions, and a property-count-based snapshot calculation. These figures are **demonstration placeholders** and must not be represented as actual investment performance, assets under management, customer balances, or returns.

The product source does not by itself establish that MarketMix operates a regulated investment product, holds investor funds, fractionalizes ownership, provides securities, or offers guaranteed yield. Any such activity would require separate legal, licensing, custody, disclosure, and operational review. Keep property discovery and actual investment transactions clearly separated.

If the dashboard is used in a pitch, label it “prototype / sample data” on every screen. Better still, replace it with a live operational dashboard backed by reconciled records, or omit the return figures until data and legal scope are validated.

Investor discussions should focus on the marketplace thesis, distribution, supply quality, service workflows, and evidence plan. Any future investment product should be introduced only after appropriate professional advice and partner due diligence.

\newpage
# 22. Revenue model: what is visible and what is a hypothesis

The code reveals several possible monetization surfaces: paid viewing or search packages, transport commission, promotional placement or campaign participation, and potentially other property services. A feature that accepts a payment or contains a commission constant does not prove consistent sales, collected revenue, or positive margin.

For every revenue stream, document payer, price, value delivered, refund policy, tax treatment, payment-provider cost, support cost, partner share, and contribution margin. Avoid mixing gross payment volume with platform revenue. Distinguish pending authorizations, successful charges, settled funds, refunds, chargebacks, and net revenue.

Potential future models include landlord subscriptions, qualified lead fees, listing promotion, viewing coordination, tenant services, moving referrals, or campaign sponsorship. These are hypotheses until tested with willingness-to-pay research and transparent customer consent.

The first commercial priority should be a small number of understandable offers whose outcomes can be measured. Too many fees can reduce trust and confuse customers about whether they are paying for access, a viewing, transport, or the property itself.

\newpage
# 23. Go-to-market approach

The marketplace should launch with concentrated supply and service coverage. Choose a defined area and one or two customer needs where the team can maintain accurate listings and fast responses. A dense local cluster can create better customer outcomes than a broad catalogue with weak availability.

Landlord acquisition can begin with direct onboarding, property managers, student housing operators, and agent networks. Demand acquisition can use search content, neighborhood guides, university or employer communities, referral programs, and scheduled viewing campaigns. Each channel should carry a trackable source and a cost.

Transport can be layered where request density and provider coverage are adequate. Do not promise instant dispatch in an area without driver capacity. Make service-area boundaries visible and maintain a manual escalation path.

The team should review weekly funnel data: new verified listings, active inventory, inquiry response time, qualified viewing requests, completed viewings, move requests, completed moves, repeat use, refunds, complaints, and acquisition cost. Use cohort definitions consistently and publish reporting periods.

\newpage
# 24. Marketplace liquidity

Liquidity means a customer can find a relevant option and get a timely response. It is not simply the number of listings or registered accounts. A useful local liquidity score might combine active verified supply, demand coverage, response speed, and completed customer outcomes.

Supply liquidity can be improved by re-confirming inventory, standardizing listing data, onboarding professional landlords, and removing stale properties. Demand liquidity can be improved by answering search demand with relevant inventory and giving users clear alternatives when exact matches are unavailable.

Operational liquidity depends on agent availability, viewing schedules, drivers, and support hours. A platform may have a technically complete workflow but insufficient people to deliver it. Track coverage by neighborhood and time of day.

Investors should request evidence for both sides of the market: active supply by micro-market, qualified inquiries, response and attendance rates, and completed outcomes. Include denominators and cohort dates. A high listing count with low availability confirmation is not strong liquidity.

\newpage
# 25. Metrics and evidence plan

**Supply:** verified active listings, unique landlords, complete listing rate, stale-listing rate, and days from submission to approval. **Demand:** unique qualified searchers, detail-to-inquiry rate, inquiry-to-response time, and repeat search rate. **Service:** confirmed viewing rate, attendance, cancellation, no-show, successful match, and time to resolution.

**Transport:** quote acceptance, dispatch time, completion, cancellation, driver utilization, incident rate, refund rate, and contribution margin per completed trip. **Campaigns:** paid registrations, attendance, qualified follow-up, and downstream viewing or transaction conversion. **Financial:** gross payment volume, net settled receipts, refunds, provider fees, partner payouts, variable support cost, and contribution margin.

Define each metric before publishing it. Deduplicate users and events, separate test transactions, explain the reporting window, and retain source queries. Report both counts and rates. Suppress or contextualize small cohorts that could expose personal information.

None of these measures is supplied as a verified company result in this briefing. They are the operating dashboard an investor should ask the team to produce from production records.

\newpage
# 26. Unit economics framework

For a viewing package, calculate net revenue as settled customer payment less refund, payment-provider costs, agent/provider payout, customer support, and variable delivery costs. For transport, calculate platform commission less payment costs, incentives, refunds, and variable support. For campaigns, include venue, staff, transport, content, and acquisition costs.

Separate fixed costs such as engineering, hosting, compliance, and general operations from costs that rise with each booking. Include failed payment and refund handling. Use realized transactions rather than list prices or default configuration.

Customer acquisition cost should include the labor and marketing spend required to acquire a customer or landlord, not just paid advertising. Lifetime value should be based on observed repeat behavior and contribution margin, not on a speculative multi-year assumption.

Build low, base, and high scenarios with explicit inputs: active listings, monthly qualified demand, conversion rates, average fee, refund rate, provider fee, and support minutes. Label assumptions and show the breakeven volume. No financial result should be presented as actual until reconciled.

\newpage
# 27. Competitive positioning

MarketMix can position itself around a connected local journey: property discovery plus viewing coordination and, where available, moving support. The product may also differentiate through role-specific tools and event-style property tours. These are product capabilities; the competitive advantage depends on execution, data quality, partnerships, and customer trust.

Competition includes property portals, social groups, brokers, property managers, classifieds, direct landlord marketing, transport operators, and informal networks. Customers may combine these options. A realistic comparison should include the user’s current workflow, not only other websites.

Potential defensibility could come from trusted local supply relationships, verified operational records, efficient lead response, repeat customer behavior, and service density. A feature set is replicable; consistent outcomes and trustworthy data are harder to reproduce.

Use current, sourced competitor research before making market or superiority claims. A pitch should say what the product does differently and show evidence of customer preference, not assert that competitors lack a feature without verification.

\newpage
# 28. Technology and architecture

The frontend uses React with Vite and route-based views. The backend is an Express service. Firebase Authentication provides identity, and Firestore stores records used by the product. IntaSend is integrated for M-Pesa payment initiation and callbacks. Media upload components reference Cloudflare tooling.

Role-aware routes support buyers, landlords/sellers, agents, investors, drivers, and administrators. Data structures include properties and protected property data, user records, inquiries, bookings, campaign registrations, transport requests, and related operational logs. This description is based on repository code, not a third-party architecture audit.

A production readiness review should cover environment separation, secrets management, Firebase security rules, Admin SDK privileges, API authentication and authorization, input validation, CORS, rate limiting, audit logs, backups, disaster recovery, dependency patching, payment idempotency, and incident response.

The separate MarketMix backend may contain unrelated marketplace and WhatsApp code. Keep service boundaries and permissions explicit. Do not include credentials, private keys, phone lists, or customer data in investor materials or public repositories.

\newpage
# 29. Data governance and privacy

The product handles identity, contact details, property information, inquiries, bookings, payment references, and potentially driver location and documents. Each field should have a defined purpose, access policy, retention period, deletion or correction path, and responsible owner.

Use least-privilege access for staff and service accounts. Separate public listing data from private contact or verification data. Audit administrator access and changes to payment, role, driver, and listing status. Protect exports and use anonymized data in demonstrations.

The website has Privacy and Cookies routes. Their presence does not establish legal adequacy. Confirm the live policy describes actual vendors, international transfers, cookies, user rights, retention, contact channels, and data-sharing practices. Obtain privacy and legal review for the applicable Kenyan requirements and any other jurisdictions served.

Do not put real customer names, phone numbers, identity documents, or payment references into a pitch deck. Use aggregated metrics with minimum cohort thresholds and documented consent where needed.

\newpage
# 30. Safety, fraud, and dispute handling

Property marketplaces face fake listings, impersonation, advance-fee scams, bait pricing, duplicate content, unsafe viewings, and unauthorized agents. Transport adds vehicle, driver, damage, personal safety, and location risks. Payments add duplicate charges, mismatched amounts, delayed callbacks, and refund disputes.

Preventive controls include identity and listing authority checks, clear report buttons, moderated publication, payment reconciliation, driver approval, visible status, and staff escalation. Response controls include a case reference, evidence preservation, customer updates, refund review, account restriction where justified, and appeal handling.

Publish what MarketMix verifies and the limits of verification. A platform should not imply that a listing, landlord, driver, property condition, or investment is guaranteed unless that claim is contractually and operationally true.

Maintain an incident log with severity, time to acknowledge, resolution, financial impact, repeat cause, and preventive action. Investors should examine real incident examples with personal data removed and ask how controls changed afterward.

\newpage
# 31. Legal and regulatory readiness

Before expansion or fundraising, counsel should map the legal roles MarketMix performs in listings, brokerage or agency relationships, viewing services, payment collection, transport dispatch, marketing, data processing, and any investment-related presentation. The answer can differ by product and geography.

Review Terms, Privacy, Cookies, refund terms, landlord and agent agreements, driver terms, campaign terms, payment disclosures, consumer complaint routes, and intellectual-property permissions. Ensure the party receiving money is clearly identified and authorized for that transaction.

The investor dashboard’s simulated returns should not be presented as investment offers or performance. If the business plans to offer investments, fractional interests, custody, pooling, or return forecasts, obtain specialist legal and regulatory advice before launch.

This chapter is a diligence checklist, not legal advice. No statement here confirms compliance. Obtain current advice from qualified Kenyan counsel and, if applicable, relevant regulators and payment or transport partners.

\newpage
# 32. Operations and customer support

The product requires human operations for listing review, inquiry routing, viewing coordination, driver approval, transport exceptions, campaign attendance, payment reconciliation, and disputes. Assign an owner and service-level target for each queue.

Support should capture customer identity safely, affected listing or booking, timeline, payment reference where relevant, desired resolution, evidence, assigned owner, next update deadline, and closure reason. Avoid resolving sensitive cases solely in undocumented personal messaging.

Create playbooks for unavailable listings, missed viewings, agent no-shows, driver cancellation, late arrival, property misrepresentation, duplicate charge, payment pending, refund calculation disagreement, safety incident, and data request. Include escalation contacts and customer communication templates.

Review queue age and repeat causes daily or weekly. Good automation should reduce avoidable handoffs while preserving a human path for unusual cases. Measure support time per completed transaction as part of unit economics.

\newpage
# 33. Brand, marketing, and content

MarketMix’s brand voice can emphasize local discovery, transparent choices, and practical coordination. Marketing should be specific about what a customer can do today and where service coverage exists. Avoid implying that every property is verified, every trip is immediate, or every viewing fee guarantees a lease.

The website includes content and campaign surfaces. Use them to answer real customer questions: neighborhood comparisons, viewing checklists, moving preparation, landlord listing guidance, and scam awareness. Keep claims current and link to the underlying service terms.

Testimonials require permission and should not be edited in a way that changes meaning. Case studies should state timeframe, sample size, and whether results are representative. Mark paid placements or sponsorship clearly.

For investors, retain a library of approved claims with evidence owner and last review date. Remove placeholder statistics from source defaults and production content. A polished interface is valuable, but substantiated customer outcomes build credibility.

\newpage
# 34. Accessibility and mobile usability

Property discovery is often performed on a phone. Search, image loading, form completion, map or location context, payment status, and support actions should work on small screens and weaker connections. The transport and viewing workflows need large, clear status and contact controls.

Accessibility should include keyboard navigation, visible focus, form labels, readable contrast, alternative text for meaningful images, semantic headings, and error messages that explain how to recover. Avoid time-limited payment or booking screens without a clear extension or retry path.

The repository contains responsive components, but source review is not an accessibility audit. Test with screen readers, keyboard only, zoom, and low-bandwidth mobile devices. Prioritize high-impact journeys: search, inquiry, booking, payment, cancellation, and transport request.

For landlord and agent dashboards, preserve work during network interruptions and provide clear save states. For administrators, make review queues usable without relying on color alone.

\newpage
# 35. Roadmap priorities

**Foundation:** remove demo metrics from public-facing investor surfaces; verify every live route; reconcile package prices and refund terms; audit authentication, authorization, and payment callbacks; document service areas and support ownership.

**Trust:** add listing freshness and verification evidence, fraud reporting, response-time tracking, transparent fees, refund status, and clear driver information. Improve audit logs for manual campaign counts and financial changes.

**Liquidity:** focus inventory acquisition in selected neighborhoods; improve search relevance and empty states; route inquiries to accountable agents; introduce viewing availability calendars; measure attendance and outcomes.

**Scale:** automate reliable reminders and reconciliation; add landlord and agent retention tools; expand transport only when driver coverage and economics are demonstrated; develop campaigns from measured participation. Prioritize by customer impact, operational burden, and evidence of willingness to pay.

\newpage
# 36. Landlord playbook

1. Create the appropriate account and complete the contact details requested. 2. Submit only properties you own or are authorized to market. 3. Enter current price, deposit, availability, terms, location, facilities, and viewing conditions. 4. Upload recent, representative images with rights to use them. 5. Respond to review questions promptly. 6. Once published, keep availability and price current. 7. Acknowledge inquiries and coordinate safe viewings. 8. Mark the listing unavailable when appropriate.

Before paying for a promotion or service, ask for the amount, duration, placement, expected deliverable, refund terms, and reporting. Keep an invoice or receipt. Do not ask customers to pay a property deposit through a MarketMix service checkout unless the product clearly identifies that payment purpose and authorized recipient.

Use a dedicated business contact where possible. Avoid posting tenant documents or personal details publicly. Store viewing records securely and follow applicable privacy obligations.

The landlord’s key outcome is a reliable path to a qualified tenant or buyer. Review inquiry quality, response speed, viewing attendance, and time to transaction with the platform.

\newpage
# 37. Agent playbook

Keep your profile and coverage current. Only accept leads for listings you are authorized to represent. Respond quickly with accurate availability and propose specific viewing windows. Confirm the customer’s preferred contact method and share only the information needed to coordinate the visit.

Before a viewing, reconfirm access with the responsible landlord, confirm the customer knows the location and any safety instructions, and update the appointment status. Afterward, record whether the customer attended and the next action. If the property is no longer available, update the listing and suggest alternatives without misrepresenting them.

Escalate payment discrepancies, unsafe conditions, duplicate leads, or disputes through the documented support route. Do not promise a refund or payout outside the published process. Keep proof of any agreed commission or service payment.

An agent dashboard is a workflow aid; it does not automatically establish earnings or legal authority. Keep professional credentials and property authorization available as required by the applicable rules.

\newpage
# 38. Renter and buyer playbook

Set your location, budget, timing, household needs, and must-have features before searching. Compare multiple listings and check when each was last confirmed. Ask about total move-in cost, deposit, recurring charges, lease duration, utilities, repairs, access, and who is authorized to sign the agreement.

Arrange a viewing through a traceable contact. Tell someone you trust where you are going, meet in a safe way, and inspect the property before making a commitment. Verify the person’s authority and obtain written terms. Avoid pressure to pay immediately or to share one-time passwords.

If you purchase a MarketMix viewing package, confirm its exact scope and refund terms. If you request transport, agree the quote, vehicle, driver, capacity, and payment method. Keep receipts and booking references.

Report suspected fraud or material listing errors through the website support channel. Include facts and evidence, but do not post private identity documents publicly.

\newpage
# 39. Driver playbook

Complete onboarding accurately and provide the documents required for review. Do not accept trips until approval is confirmed. Keep vehicle, capacity, insurance, and contact details current. Review the pickup, destination, item list, timing, quote, and payout before accepting.

During service, communicate delays early, protect customer belongings, follow road-safety requirements, and use location sharing only as described by the product. Mark status changes promptly. For an incident, prioritize safety and use the escalation channel before continuing the job.

Confirm how cancellation, waiting, damage claims, customer no-shows, and payment settlement work. Keep trip records and report discrepancies with the trip reference. A dashboard balance or completed status should be reconciled to an actual payout record.

The platform should provide a named operations contact and a clear process for appeals or account review. Drivers should never be asked to pay an unofficial fee to receive a trip or payout.

\newpage
# 40. Campaign organizer playbook

Define the event purpose, properties, route, capacity, location, schedule, package inclusions, accessibility, safety plan, and responsible organizer. Publish clear registration terms, payment status definitions, cancellation rules, and contact information.

Reconcile online payments and offline attendance records. Use separate statuses for registered, paid, confirmed, attended, cancelled, and refunded. Record manual adjustments with user, timestamp, and reason. Give participants arrival instructions and a route to ask for help.

After an event, measure attendance, completed viewings, qualified follow-ups, customer feedback, landlord satisfaction, incident count, and costs. Share only aggregate participant data with partners unless the attendee has agreed to more.

Do not use registration totals as proof of property sales or demand quality. A successful event creates useful customer outcomes and trustworthy follow-up, not just a large count.

\newpage
# 41. Investor FAQ

**Is this a property portal or a broader service platform?** The codebase combines discovery with viewing and transport workflows; the company should clarify which services are actively operated and which are experiments.

**How many customers or listings does it have?** This briefing makes no verified claim. Request dated production reports with clear definitions and deduplication.

**What are the current package prices?** Source defaults exist, but administrator settings may override them. Confirm live settings and customer receipts.

**Does the investor dashboard show returns?** The reviewed values are simulated placeholders. They are not actual performance or assets.

**How does it make money?** Code contains potential paid-service surfaces and a transport commission path. Actual revenue and margin require reconciled transactions.

**What is the moat?** Potentially local supply density, trusted data, and dependable coordination. Demonstrate these with retention and outcomes before calling them defensible.

\newpage
# 42. Investor diligence checklist

**Product:** production URLs, role journeys, feature flags, error logs, mobile usability, analytics definitions, and evidence that each claimed feature works. **Market:** target geography, customer interviews, competitor research, supply segmentation, and demand channel performance.

**Commercial:** signed landlord/agent/driver agreements, pricing approvals, invoices, payment-provider terms, refunds, taxes, gross-to-net reconciliation, cohort economics, and repeat use. **Operations:** staffing, response targets, support cases, safety incidents, verification policy, and supplier coverage.

**Technology:** architecture diagram, deployment ownership, security rules, privileged accounts, secrets controls, backup and recovery, incident history, dependency management, penetration testing, and payment idempotency. **Legal:** entity and ownership documents, customer terms, privacy review, regulatory analysis, IP assignment, employment/contractor agreements, and insurance.

**Financial:** historical statements, bank and provider reconciliations, liabilities, runway, use of funds, scenario assumptions, and board reporting. Treat unsupported dashboard values as excluded until independently substantiated.

\newpage
# 43. Pitch narrative

**Opening:** Finding a property is only the first step; customers also need dependable information, a viewing, and sometimes transport. **Product:** MarketMix brings property discovery and related coordination into one role-aware web experience. **Customer:** Focus first on a defined local segment with measurable friction and reachable supply.

**Demonstration:** Show a current approved listing, inquiry, viewing request, and the real operational status behind it. Show a landlord or agent response workflow. If transport is enabled in the area, show how a quote and driver assignment are confirmed. Use only live, sanitized records.

**Business model:** Explain each fee and payer separately; distinguish source-code pathways from collected revenue. **Evidence:** Present verified supply, response, attendance, completion, repeat behavior, and unit economics with dated definitions. **Ask:** Tie funding to operational milestones—supply quality, service reliability, and proven contribution margin.

Close by stating the top risks and the plan to reduce them. Credibility improves when the pitch openly distinguishes current proof from future opportunity.

\newpage
# 44. Glossary and status definitions

**Approved listing:** a property record allowed by the product’s publication workflow to appear publicly; this does not necessarily mean a physical inspection or title verification. **Qualified inquiry:** a prospect contact meeting a company-defined intent and completeness standard. **Confirmed viewing:** date and time accepted by the responsible party and communicated to the customer.

**Payment initiated:** a request was sent to a provider. **Paid / settled:** use these terms only according to reconciled provider records; they are not interchangeable. **Refund requested:** a customer submitted a request. **Refund approved:** an internal decision; not proof of payout. **Refund completed:** settlement evidence confirms the amount reached the customer.

**Demo value:** a sample number used in prototype UI. **Code default:** a fallback value embedded in source, potentially overridden by settings. **Production metric:** a value calculated from real, deduplicated, dated records with a documented query and owner.

These definitions should be adopted consistently across dashboards, support scripts, investor reports, and customer-facing pages.

\newpage
# 45. Closing perspective and next steps

MarketMix Real Estate has a substantial product surface: property discovery, role-specific workflows, viewing coordination, transport, campaigns, and administration. That breadth creates opportunities to serve a connected customer journey, and it also creates a demanding operating model. Trust, current inventory, responsive partners, transparent payments, and clear accountability will determine whether the product earns repeat use.

The strongest next investor package is evidence-led: remove sample metrics; verify live routes and configuration; document actual service coverage; reconcile payments and refunds; audit listing freshness; and publish a small set of customer outcomes with denominators. Pair that evidence with a focused geography, clear pricing, and a staged roadmap.

For users and partners, the practical promise should be simple: accurate information, clear next steps, understandable fees, and a human support path when things go wrong. Keep that promise measurable and improve it from customer feedback.

**Prepared for discussion with investors, landlords, agents, renters, buyers, drivers, campaign partners, and MarketMix operations.**

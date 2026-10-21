from datetime import datetime
from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

OUT = Path(__file__).resolve().parents[1] / "MarketMix_Investor_Brief.docx"

def paragraph(text, style=None):
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f'<w:p>{ppr}<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'

def bullet(text):
    return f'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'

def heading(text, level=1):
    return paragraph(text, f"Heading{level}")

parts = [
    paragraph("MARKETMIX REAL ESTATES", "Subtitle"),
    paragraph("Investor Brief", "Title"),
    paragraph("A connected property journey for Kenya: discover a home, arrange a viewing and plan the move.", "Subtitle"),
    paragraph("Prepared 20 October 2026  |  Product and business overview"),
    heading("Investment overview"),
    paragraph("MarketMix Real Estates is a mobile-first platform designed to bring property discovery and the services around moving into one connected customer journey. People can browse homes, contact listing parties, coordinate viewings and request moving support. Landlords, agents, drivers and administrators use role-based tools to handle supply and service requests."),
    paragraph("The investment case is the opportunity to reduce friction between finding a property and completing the practical steps that follow. The app provides a product foundation; growth, transaction volume, fee conversion and unit economics must be established through operating pilots and verified records."),
    heading("The market gap"),
    paragraph("Property seekers often navigate separate channels for listings, questions, viewings and transport. Information can be incomplete or out of date, responsibility for follow-up can be unclear, and each handoff asks the customer to start a new conversation. Listing providers also face fragmented lead handling, while moving providers may receive requests without enough detail to quote confidently."),
    bullet("Discovery is spread across portals, social media, agents and personal networks."),
    bullet("Availability, location details and the authority to represent a property can be hard to assess."),
    bullet("Viewing arrangements, reminders and customer follow-up are often coordinated manually."),
    bullet("A customer who secures a home still has to find and coordinate transport independently."),
    paragraph("This is a product-market hypothesis, not a quantified claim about market size. MarketMix should validate the depth of each pain point in its launch neighborhoods through interviews, conversion data and service outcomes."),
    heading("The solution and customer journey"),
    paragraph("MarketMix connects the main steps in one mobile-friendly experience:"),
    bullet("Discover and compare property listings, with search and filters."),
    bullet("Review property details, media and location information; save a listing or contact its owner or agent."),
    bullet("Request or coordinate a viewing, including guided site-seeing options where available."),
    bullet("Request a move by describing the route, items and vehicle needs, then follow the quote and trip status."),
    bullet("Keep account activity, bookings, payment records and service updates accessible in the app."),
    paragraph("The current product also includes roommate discovery, short-stay and visit-campaign experiences, property management tools, driver workflows and administrator review screens."),
    heading("Who the platform serves"),
    bullet("Renters and buyers: search, compare, contact, view and arrange a move."),
    bullet("Landlords and agents: publish listings, manage property details and respond to interest."),
    bullet("Drivers and transport providers: register service capability and manage eligible requests."),
    bullet("Operations teams: review listings, coordinate service requests and resolve exceptions."),
    heading("Why MarketMix can stand out"),
    paragraph("The product proposition is an integrated workflow around a property decision, rather than a listing page alone. Linking discovery, viewing and moving creates opportunities to improve continuity, capture customer intent and learn where service handoffs fail. Role-based tools create a basis for operating standards across the supply side."),
    paragraph("The advantage must be earned locally: accurate inventory, trusted listing parties, fast responses and dependable fulfilment are more important than feature count. A focused launch area can help MarketMix build supply density and service reliability before expanding."),
    heading("Business model: fees for completed value"),
    paragraph("The proposed commercial model combines transparent booking or coordination fees with referral revenue on qualifying completed outcomes. Additional revenue paths can be piloted as the marketplace develops. Pricing and partner terms should be tested with customers and providers before being represented as established revenue."),
    bullet("Booking and coordination fees: disclose the service, price and cancellation/refund terms before a customer confirms a paid viewing, site visit or moving service."),
    bullet("Referral fees: agree terms with participating providers and pay or recognize a referral only when the defined, trackable outcome is completed. Clearly identify who pays the fee and what triggers it."),
    bullet("Provider tools and listing promotion: test optional paid packages or boosted visibility with landlords and agents, while keeping ranking and sponsorship transparent."),
    bullet("Partnerships: explore relevant services around housing and moving only where the partner delivers clear customer value."),
    paragraph("The model is designed to connect revenue to delivered service or attributable outcomes. It is not a claim that these fees are already collected at scale. No fee rates, referral commissions or revenue forecasts are stated here because verified, approved commercial terms were not available in the materials reviewed."),
    heading("Proposed booking and referral operating rules"),
    paragraph("Booking fees should attach to a specific service the customer chooses, such as a facilitated viewing or a moving request. Before payment, show the service scope, provider, amount, cancellation window and refund route. A booking is recognized as completed only after the customer and provider confirm delivery or an administrator resolves conflicting evidence."),
    paragraph("Referral fees should be governed by a written partner agreement. Each referral receives a traceable referral ID, named receiving provider, attribution window and outcome definition. A fee becomes payable only after the agreed outcome is evidenced and any customer cancellation or dispute window has closed. No fee is charged twice for the same customer outcome."),
    paragraph("The proposed pilot sequence is: (1) test customer-paid coordination fees on optional, clearly described services; (2) test provider-paid referral fees for verified completed outcomes; and (3) review optional listing promotion after the core journey is trusted. Keep the customer price separate from the provider's quote and disclose any provider-paid referral relationship where relevant."),
    heading("Admin controls and reconciliation"),
    bullet("Admin approval: publish and service-provider access should follow documented identity, listing-authority and capability checks appropriate to the service."),
    bullet("Evidence: retain the booking or referral ID, consented customer/provider confirmations, service status, payment reference, fee calculation and timestamps."),
    bullet("Exceptions: pause disputed or unverified fees; route cancellations, no-shows and refunds through a documented decision path with an audit trail."),
    bullet("Payouts: release partner/referral amounts only after the outcome is verified, settlement is reconciled and any hold period has ended."),
    bullet("Reporting: give admins a period view of bookings, completed outcomes, collected fees, refunds, pending reviews and amounts due by partner."),
    paragraph("A simple contribution check for each completed service is: customer coordination revenue + eligible partner referral revenue − payment costs − refunds − variable support and fulfilment costs. Track these components separately; do not treat booking value or a pending referral as MarketMix revenue."),
    heading("Go-to-market and validation"),
    paragraph("Start with a defined launch geography and a narrow set of property types. Recruit and verify listing supply, establish response expectations, and operate viewing and moving requests with human support where automation is not yet dependable. Use local relationships and referrals to acquire customers, then expand only when service quality supports it."),
    bullet("Supply: verified active listings, completeness of listing data and time to confirm availability."),
    bullet("Demand: qualified inquiries, inquiry-to-viewing conversion and repeat customer use."),
    bullet("Service: viewing attendance, move completion, response times, complaints and refunds."),
    bullet("Economics: booking-fee conversion, referral attribution, cost to fulfil and contribution per completed service."),
    heading("Product and operating foundation"),
    paragraph("The codebase includes a React mobile-first application, Android packaging with Capacitor, Firebase authentication and data services, an Express backend, payment initiation paths, communications integrations and role-based workflows. These are implementation capabilities. They do not by themselves prove live partner approvals, successful payment settlement, uptime, user demand or regulatory compliance."),
    heading("Investment opportunity"),
    paragraph("Investment can accelerate the work needed to prove a trusted local marketplace: verified inventory, neighborhood operations, customer support, provider onboarding, reliable payments, analytics and measured acquisition. Funding milestones should be tied to evidence of service quality and repeatable unit economics."),
    bullet("Milestone 1: select the launch geography, customer segment and operating standards."),
    bullet("Milestone 2: demonstrate dependable inventory and timely responses to qualified inquiries."),
    bullet("Milestone 3: run and reconcile a defined viewing and moving pilot, including refunds and service costs."),
    bullet("Milestone 4: show repeatable customer acquisition, completed outcomes and positive contribution trends before wider expansion."),
    heading("Key risks and diligence priorities"),
    bullet("Marketplace liquidity: enough current listings and responsive providers must exist in each launch area."),
    bullet("Trust and safety: verify listing authority, set clear service terms and provide escalation for disputes."),
    bullet("Execution: viewing and moving quality depends on local operations, not software alone."),
    bullet("Payments and compliance: validate provider onboarding, settlement, refunds, privacy and applicable requirements."),
    bullet("Commercial validation: confirm customer willingness to pay and partner acceptance of referral terms."),
    paragraph("Before external circulation, add verified dated figures for active listings, users, inquiries, completed bookings, collected revenue, refunds, partner coverage and costs. The current brief intentionally makes no unsupported traction or market-size claims."),
    heading("Closing"),
    paragraph("MarketMix is building toward a more connected property journey: find a place, arrange the viewing and plan the move. The opportunity is to make local property services easier to navigate and more accountable, then expand on evidence from a focused operating market."),
    paragraph("MarketMix Real Estates  |  Discussion document  |  Product and commercial assumptions require validation before investment decisions."),
]

document = "".join(parts)
styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="26352D"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="150" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:sz w:val="46"/><w:color w:val="103D2B"/></w:rPr><w:pPr><w:spacing w:before="120" w:after="220"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="26"/><w:color w:val="148052"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:sz w:val="30"/><w:color w:val="103D2B"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="148052"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="480" w:hanging="240"/><w:spacing w:after="100"/></w:pPr></w:style>
</w:styles>'''
numbering = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="480"/></w:tabs><w:ind w:left="480" w:hanging="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'''
content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>'''
rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>'''
doc = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{document}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="540" w:footer="540" w:gutter="0"/></w:sectPr></w:body></w:document>'''

with ZipFile(OUT, "w", ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", content_types)
    archive.writestr("_rels/.rels", rels)
    archive.writestr("word/document.xml", doc)
    archive.writestr("word/styles.xml", styles)
    archive.writestr("word/numbering.xml", numbering)
    archive.writestr("word/_rels/document.xml.rels", doc_rels)

print(OUT)

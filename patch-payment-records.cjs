const fs = require('node:fs');
const path = require('node:path');

const input = 'C:/Users/ADMIN/Downloads/server.js';
const output = path.join(__dirname, 'server-payment-records-review.js');
let source = fs.readFileSync(input, 'utf8');
const nl = source.includes('\r\n') ? '\r\n' : '\n';
const format = (value) => value.replace(/\n/g, nl);

const seedMarker = '    await db.collection("orders").doc(ref).set({';
const seedIndex = source.indexOf(seedMarker);
if (seedIndex < 0) throw new Error('Real-estate seed write not found.');
const routeStart = source.lastIndexOf('app.post("/api/real-estate/seed"', seedIndex);
const seedAuth = `    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let buyerUserId = null;
    if (idToken) {
      try { buyerUserId = (await verifyAnyToken(idToken)).uid; }
      catch { return res.status(401).json({ success: false, message: "Invalid auth token" }); }
    }
`;
source = source.slice(0, seedIndex) + format(seedAuth) + source.slice(seedIndex);
const seedUserId = '      orderId: ref, orderType: "real_estate", isRealEstate: true,';
if (!source.includes(seedUserId)) throw new Error('Real-estate order fields not found.');
source = source.replace(seedUserId, seedUserId + '\n      userId: buyerUserId,');

const stkErrorLine = '      const failureMessage = paymentReceiptWhatsApp({ success: false, orderData: storedOrder || {}, apiRef: orderId, amount: amt, reason: failureReason });';
if (!source.includes(stkErrorLine)) throw new Error('STK failure notification insertion point not found.');
const persistFailure = `      const orderRef = db.collection("orders").doc(String(orderId));
      await orderRef.set({
        orderId: String(orderId), orderType: storedOrder?.orderType || (isRealEstateRef(String(orderId)) ? "real_estate" : "payment"),
        ...(isRealEstateRef(String(orderId)) ? { isRealEstate: true } : {}),
        userId: storedOrder?.userId || null,
        buyerName: storedOrder?.buyerName || fullName || "Customer",
        userEmail: storedOrder?.userEmail || email || null,
        buyerEmail: storedOrder?.buyerEmail || email || null,
        phoneNumber: payerPhone || null,
        totalAmount: Number(storedOrder?.totalAmount || amt || 0),
        paymentStatus: "failed", state: "STK_PUSH_FAILED",
        paymentFailureReason: failureReason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(!storedOrder?.createdAt ? { createdAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
      }, { merge: true }).catch((writeError) => console.error("Could not save failed payment record:", writeError.message));
      if (storedOrder?.isSiteSeeingBooking && storedOrder.bookingId) {
        const bookingRef = reDb.collection("sightseeingBookings").doc(String(storedOrder.bookingId));
        const packagePayment = storedOrder.isCompletion === true || storedOrder.bookingMode === "direct_booking";
        await bookingRef.set(packagePayment
          ? { packagePaymentStatus: "failed", ...(storedOrder.bookingMode === "direct_booking" ? { paymentStatus: "failed", status: "payment_failed", bookingStatus: "payment_failed" } : {}), updatedAt: admin.firestore.FieldValue.serverTimestamp() }
          : { availabilityPaymentStatus: "failed", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
        await bookingRef.collection("payments").doc(String(orderId)).set({ paymentRef: String(orderId), bookingId: String(storedOrder.bookingId), userId: storedOrder.userId || null, amount: Number(storedOrder.totalAmount || amt || 0), currency: "KES", paymentStatus: "failed", paymentFailureReason: failureReason, paymentKind: packagePayment ? "sightseeing_package" : "sightseeing_availability_check", updatedAt: admin.firestore.FieldValue.serverTimestamp(), createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
      }
`;
source = source.replace(stkErrorLine, format(persistFailure) + stkErrorLine);

const callbackFailure = 'amount: Number(orderData.totalAmount || 0), currency: "KES", paymentStatus, paymentKind: packagePayment ? "sightseeing_package" : "sightseeing_availability_check", mpesaReference: mpesa_reference || null, updatedAt: admin.firestore.FieldValue.serverTimestamp()';
if (!source.includes(callbackFailure)) throw new Error('Site-seeing callback payment record not found.');
source = source.replace(callbackFailure, 'amount: Number(orderData.totalAmount || 0), currency: "KES", paymentStatus, paymentFailureReason: paymentStatus === "failed" ? paymentFailureReason(req.body, orderData) : null, paymentKind: packagePayment ? "sightseeing_package" : "sightseeing_availability_check", mpesaReference: mpesa_reference || null, updatedAt: admin.firestore.FieldValue.serverTimestamp()');

fs.writeFileSync(output, source, 'utf8');
console.log(`Prepared ${path.basename(output)} (${source.length} characters).`);

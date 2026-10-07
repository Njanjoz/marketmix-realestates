// src/services/paymentService.js - IntaSend Payment Service Client

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

/**
 * Initiate M-Pesa STK Push
 */
export const initiateStkPush = async ({ amount, phoneNumber, fullName, email, orderId }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stk-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, phoneNumber, fullName, email, orderId })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'STK Push failed');
    }
    return { success: true, data: data.data };
  } catch (error) {
    console.error('STK Push error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Initiate KSh 1 Test Payment Flow
 */
export const initiateTestPayment = async ({ phoneNumber, fullName, email, testRef = `TEST_${Date.now()}` }) => {
  return initiateStkPush({
    amount: 1, // KSh 1 test payment
    phoneNumber,
    fullName,
    email,
    orderId: testRef
  });
};

/**
 * Check transaction status (Ad transaction or order)
 */
export const checkTransactionStatus = async (paymentRef) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ad-transaction/${paymentRef}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Transaction lookup failed');
    }
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Transaction check error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Initiate Subscription Payment
 */
export const initiateSubscriptionPayment = async ({ amount, phoneNumber, fullName, email, orderId, planId, sellerId }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/subscription-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, phoneNumber, fullName, email, orderId, planId, sellerId })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Subscription payment failed');
    }
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Subscription payment error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Seller Withdrawal
 */
export const requestWithdrawal = async ({ sellerId, amount, phoneNumber }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/seller/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId, amount, phoneNumber })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Withdrawal failed');
    }
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Withdrawal error:', error);
    return { success: false, message: error.message };
  }
};

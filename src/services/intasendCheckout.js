const ENV_PUBLIC_KEY = import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://marketmix-api-native.johnnjanjo1.workers.dev';
let publicKeyPromise;
let sdkPromise;

async function getPublicKey() {
  if (ENV_PUBLIC_KEY) return ENV_PUBLIC_KEY;
  if (!publicKeyPromise) {
    publicKeyPromise = fetch(`${BACKEND_URL}/api/public-config`)
      .then((response) => response.ok ? response.json() : {})
      .then((config) => config.intasendPublishableKey || '')
      .catch(() => '');
  }
  return publicKeyPromise;
}

function loadSdk() {
  if (window.IntaSend) return Promise.resolve(window.IntaSend);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/intasend-checkout-sdk';
    script.async = true;
    script.onload = () => window.IntaSend ? resolve(window.IntaSend) : reject(new Error('IntaSend checkout SDK did not load.'));
    script.onerror = () => reject(new Error('Unable to load IntaSend checkout.'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export async function startIntaSendCheckout({ amount, phoneNumber, fullName, email, apiRef }) {
  const publicKey = await getPublicKey();
  if (!publicKey) throw new Error('IntaSend checkout is not configured.');
  const IntaSend = await loadSdk();
  const [firstName, ...rest] = String(fullName || 'Customer').trim().split(/\s+/);
  return new Promise((resolve, reject) => {
    const checkout = new IntaSend({ publicAPIKey: publicKey, live: true, mode: 'popup' })
      .on('COMPLETE', resolve)
      .on('FAILED', (result) => reject(new Error(result?.message || 'Payment failed.')))
      .on('IN-PROGRESS', () => {});
    checkout.run({ amount: Number(amount), currency: 'KES', api_ref: apiRef, phone_number: phoneNumber, first_name: firstName || 'Customer', last_name: rest.join(' ') || 'N/A', email: email || 'customer@marketmixkenya.co.ke' });
  });
}

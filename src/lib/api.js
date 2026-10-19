// src/lib/api.js
export const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "https://backened-lt67.onrender.com";

export const sendWhatsAppNotification = (phoneNumber, kind, message) => {
  if (!phoneNumber || !message) return Promise.resolve(false);
  return fetch(`${BACKEND}/api/whatsapp/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phoneNumber, title: kind, message }),
  })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `WhatsApp request failed (${response.status})`);
      }
      return true;
    })
    .catch((error) => {
      console.warn("WhatsApp notification could not be queued:", error);
      return false;
    });
};

// src/lib/api.js
export const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "https://backened-lt67.onrender.com";

export const sendWhatsAppNotification = (phoneNumber, kind, message) => {
  if (!phoneNumber) return;
  fetch(`${BACKEND}/api/real-estate/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, kind, message }),
  }).catch(() => {});
};

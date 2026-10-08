import { useEffect, useState, useRef } from "react";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "https://backened-lt67.onrender.com";

export default function WhatsAppControl() {
  const [status, setStatus] = useState("…");
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Test from MarketMix Real Estates");
  const [result, setResult] = useState("");
  const [lastCheck, setLastCheck] = useState(null);
  const busyRef = useRef(false);

  const setBusyBoth = (v) => {
    busyRef.current = v;
    setBusy(v);
  };

  const api = async (path, opts = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${BACKEND}${path}`, {
        ...opts,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(opts.headers || {}),
        },
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data: json };
    } catch (e) {
      return {
        ok: false,
        status: 0,
        data: {
          message: e.name === "AbortError" ? "Request timed out" : e.message,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  const refreshStatus = async () => {
    setBusyBoth(true);
    setLastCheck(new Date().toLocaleTimeString());
    try {
      const r = await api("/api/real-estate/whatsapp/status");

      if (!r.ok) {
        setStatus(r.status === 0 ? "UNREACHABLE" : "ERROR");
        return;
      }

      const s = r.data?.status || "UNKNOWN";
      setStatus(s);

      if (s === "SCAN_QR_CODE") {
        const q = await api("/api/real-estate/whatsapp/qr");
        if (q.ok && q.data?.success && q.data.qr) setQr(q.data.qr);
        else setQr(null);
      } else {
        setQr(null);
      }
    } finally {
      setBusyBoth(false);
    }
  };

  const call = async (path, label) => {
    setBusyBoth(true);
    setResult("");
    try {
      const r = await api(path, { method: "POST" });
      setResult(
        r.ok && r.data?.success
          ? `✅ ${label} succeeded`
          : `❌ ${label} failed: ${r.data?.message || r.status}`
      );
    } finally {
      setBusyBoth(false);
    }
    setTimeout(refreshStatus, 2000);
  };

  const sendTest = async () => {
    if (!testPhone) {
      setResult("❌ Enter a phone number first");
      return;
    }

    let normalized = String(testPhone).replace(/\D/g, "");
    if (normalized.startsWith("0")) normalized = "254" + normalized.slice(1);
    if (!normalized.startsWith("254")) normalized = "254" + normalized;

    setBusyBoth(true);
    setResult("");
    try {
      const r = await api("/api/real-estate/whatsapp/send-test", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: normalized, message: testMsg }),
      });
      setResult(
        r.ok && r.data?.success
          ? `✅ Message sent to ${normalized}`
          : `❌ Send failed: ${r.data?.message || r.status}`
      );
    } finally {
      setBusyBoth(false);
    }
    // Kick off a status refresh after the send, not awaited so busy clears fast
    setTimeout(refreshStatus, 1500);
  };

  useEffect(() => {
    refreshStatus();
    const t = setInterval(() => {
      if (!busyRef.current) refreshStatus();
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-2">WhatsApp Control</h1>
      <p className="text-slate-500 mb-6">
        Manage WhatsApp notifications for property inquiries and payment
        receipts.
      </p>

      <div className="rounded-lg bg-slate-100 p-4 mb-4 font-mono text-sm">
        <div>
          <span className="text-slate-500">Status:</span>{" "}
          <strong
            className={
              status === "WORKING"
                ? "text-emerald-700"
                : status === "UNREACHABLE" || status === "ERROR"
                ? "text-rose-700"
                : "text-slate-900"
            }
          >
            {status}
          </strong>
          {busy && (
            <span className="ml-2 text-xs text-slate-500">checking…</span>
          )}
        </div>
        {lastCheck && (
          <div className="text-xs text-slate-500 mt-1">
            Last check: {lastCheck}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          disabled={busy}
          onClick={() => call("/api/real-estate/whatsapp/start", "Start")}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Start
        </button>
        <button
          disabled={busy}
          onClick={() => call("/api/real-estate/whatsapp/restart", "Restart")}
          className="rounded-md bg-slate-700 px-4 py-2 text-white disabled:opacity-50"
        >
          Restart
        </button>
        <button
          disabled={busy}
          onClick={() => call("/api/real-estate/whatsapp/stop", "Stop")}
          className="rounded-md bg-slate-500 px-4 py-2 text-white disabled:opacity-50"
        >
          Stop
        </button>
        <button
          disabled={busy}
          onClick={refreshStatus}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {qr && (
        <div className="mb-6 rounded-lg border-2 border-emerald-500 p-4">
          <p className="font-semibold mb-2">
            Scan with WhatsApp → Linked Devices:
          </p>
          <img
            src={qr}
            alt="WhatsApp QR"
            className="h-64 w-64 rounded border bg-white"
          />
        </div>
      )}

      {result && (
        <div className="rounded-lg bg-slate-50 border p-3 mb-4 font-semibold">
          {result}
        </div>
      )}

      <hr className="my-6" />

      <h2 className="text-lg font-semibold mb-3">Send Test</h2>
      <input
        placeholder="0783434588 or 254783434588"
        value={testPhone}
        onChange={(e) => setTestPhone(e.target.value)}
        className="w-full rounded border px-3 py-2 mb-3"
      />
      <textarea
        value={testMsg}
        onChange={(e) => setTestMsg(e.target.value)}
        className="w-full rounded border px-3 py-2 mb-3 min-h-[80px]"
      />
      <button
        disabled={busy || status !== "WORKING"}
        onClick={sendTest}
        className="rounded-md bg-emerald-700 px-4 py-2 text-white disabled:opacity-50 inline-flex items-center gap-2"
      >
        {busy ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending…
          </>
        ) : (
          "Send"
        )}
      </button>
      {status !== "WORKING" && (
        <p className="text-xs text-slate-500 mt-2">
          Send is disabled until WhatsApp status is WORKING.
        </p>
      )}
    </div>
  );
}
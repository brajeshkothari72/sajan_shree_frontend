// components/counter/DispatchBills.jsx
//
// The same bills / slip / send workflow the counter phone has, usable here on
// the owner's own login. The backend tells the two apart by how they
// authenticate - a device cookie for the phone, the admin JWT for this page -
// but it is the same data and the same /api/counter routes either way.
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Send, RefreshCw, CheckCircle2, Clock3, X, ImageOff } from 'lucide-react';
import api from '../../services/api';

const FILTERS = [
  { days: 0, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 99, label: 'All' },
];

const ymd = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

// A phone photo arrives at 4-5 MB. That is slow to upload and lands in a PDF
// the customer then downloads on mobile data. 1600px reads a handwritten slip
// perfectly well. Same scaling the counter phone page does.
function shrinkToBase64(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]);
    };
    img.onerror = () => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

function ageLabel(at) {
  if (!at) return null;
  const mins = Math.round((Date.now() - new Date(at).getTime()) / 60000);
  if (mins < 3) return { text: 'up to date', stale: false };
  if (mins < 90) return { text: `bills as of ${mins} min ago`, stale: mins > 20 };
  return {
    text: `bills as of ${new Date(at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} — the till may be off`,
    stale: true,
  };
}

const DispatchBills = () => {
  const [bills, setBills] = useState([]);
  const [at, setAt] = useState(null);
  const [days, setDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null); // voucherNumber currently open
  const [imageUrl, setImageUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInputs = useRef({});

  const load = async () => {
    try {
      const body = await api.getCounterBills();
      setBills(body.bills || []);
      setAt(body.at || null);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const visible = () => {
    if (days > 90) return bills;
    const cut = new Date();
    cut.setDate(cut.getDate() - days);
    return bills.filter((b) => Number(b.date || 0) >= ymd(cut));
  };

  const openBill = async (bill) => {
    setExpanded(bill.voucherNumber);
    setImageUrl(null);
    if (bill.slip) {
      try {
        setImageUrl(await api.getCounterSlipImageUrl(bill.voucherNumber));
      } catch {
        // The row said a slip exists; if it fails to load, the upload control
        // below still lets a new one replace it.
      }
    }
  };

  const pickFile = (voucherNumber) => fileInputs.current[voucherNumber]?.click();

  const onFileChosen = async (bill, file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const base64 = await shrinkToBase64(file);
      await api.uploadCounterSlip(bill.voucherNumber, base64);
      await load();
      await openBill({ ...bill, slip: { state: 'waiting' } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (bill) => {
    if (!window.confirm(`Send invoice ${bill.voucherNumber} on WhatsApp to ${bill.party}?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.requestCounterSend(bill.voucherNumber, bill.party);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const age = ageLabel(at);
  const rows = visible();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.days}
              onClick={() => setDays(f.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                days === f.days
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {age && (
            <span className={`text-xs ${age.stale ? 'text-amber-600' : 'text-gray-400'}`}>{age.text}</span>
          )}
          <button onClick={load} className="text-gray-400 hover:text-gray-600" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 text-sm text-gray-500">Loading…</div>
        ) : !bills.length ? (
          <div className="px-5 py-8 text-sm text-gray-500">
            No bills yet. The till sends its list up every minute — if it stays empty, check it is switched on.
          </div>
        ) : !rows.length ? (
          <div className="px-5 py-8 text-sm text-gray-500">
            No bills {days === 0 ? 'today' : `in the last ${days} days`}. Try a wider range above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rows.map((b) => {
              const isOpen = expanded === b.voucherNumber;
              const sent = b.slip?.state === 'sent';
              const hasSlip = Boolean(b.slip);
              return (
                <div key={b.voucherNumber}>
                  <button
                    onClick={() => (isOpen ? setExpanded(null) : openBill(b))}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{b.voucherNumber}</div>
                      <div className="text-sm text-gray-600 truncate">{b.party}</div>
                      {b.amount && <div className="text-xs text-gray-400">Rs. {b.amount}</div>}
                    </div>
                    <span
                      className={`flex-none px-2.5 py-1 text-xs font-semibold rounded-full ${
                        sent
                          ? 'bg-green-100 text-green-700'
                          : hasSlip
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {sent ? '✓ Sent' : hasSlip ? '✓ Slip added' : 'No slip'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={(el) => (fileInputs.current[b.voucherNumber] = el)}
                        onChange={(e) => onFileChosen(b, e.target.files[0])}
                      />

                      <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <div className="sm:w-48 flex-none">
                          {imageUrl ? (
                            <img src={imageUrl} alt="dispatch slip" className="rounded-md border border-gray-200 w-full" />
                          ) : hasSlip ? (
                            <div className="h-32 flex items-center justify-center bg-gray-100 rounded-md text-gray-400 text-xs">
                              Loading photo…
                            </div>
                          ) : (
                            <div className="h-32 flex flex-col items-center justify-center bg-gray-100 rounded-md text-gray-400">
                              <ImageOff className="w-6 h-6 mb-1" />
                              <span className="text-xs">No slip yet</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-2">
                          <button
                            onClick={() => pickFile(b.voucherNumber)}
                            disabled={busy}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-white disabled:opacity-50"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {hasSlip ? 'Replace photo' : 'Add slip photo'}
                          </button>

                          {!sent && (
                            <button
                              onClick={() => send(b)}
                              disabled={busy}
                              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send on WhatsApp now
                            </button>
                          )}

                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            {sent ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                                Already sent to the customer.
                              </>
                            ) : (
                              <>
                                <Clock3 className="w-3.5 h-3.5 mr-1.5" />
                                The till picks this up within seconds — or when it is next switched on.
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setExpanded(null)}
                          className="hidden sm:block text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchBills;

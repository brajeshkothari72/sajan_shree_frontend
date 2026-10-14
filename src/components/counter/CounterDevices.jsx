// components/counter/CounterDevices.jsx
//
// Who is allowed to use the dispatch-slip page on their phone.
//
// The counter does not log in - a password screen at a billing counter means
// the slip never gets photographed. The device is trusted instead, registered
// once from a link created here. That trade is only safe because of this page:
// a trusted device you cannot see or revoke is just a password you have lost
// track of.
import React, { useEffect, useState } from 'react';
import DispatchBills from './DispatchBills';
import { Smartphone, Link2, Copy, Check, ShieldOff, RefreshCw, ExternalLink, FileText, Users2 } from 'lucide-react';
import api from '../../services/api';

const SLIP_PAGE = `${import.meta.env.VITE_API_URL || 'https://backend.sajanshreegarments.in'}/slips`;

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  invited: 'bg-amber-100 text-amber-800',
  revoked: 'bg-gray-100 text-gray-500',
};

const CounterDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [invite, setInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('bills');

  const load = async () => {
    try {
      setDevices(await api.getCounterDevices());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setInvite(await api.createCounterInvite(label.trim() || 'Counter phone'));
      setLabel('');
      setCopied(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (device) => {
    // Spelled out rather than "Are you sure?": the consequence is that someone
    // standing at a counter suddenly cannot send, and they will not know why.
    if (!window.confirm(
      `Revoke "${device.label}"?\n\nThat phone will stop being able to add slips or send invoices immediately. ` +
      `You can register it again with a new link.`
    )) return;
    try {
      await api.revokeCounterDevice(device.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(invite.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const when = (value) =>
    value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispatch Slips</h2>
          <p className="text-sm text-gray-500 mt-1">
            Phones allowed to photograph a dispatch slip and send an invoice.
          </p>
        </div>
        <a
          href={SLIP_PAGE}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open the slip page
        </a>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('bills')}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'bills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Today's Bills
        </button>
        <button
          onClick={() => setTab('devices')}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'devices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users2 className="w-4 h-4 mr-2" />
          Registered Phones
        </button>
      </div>

      {tab === 'bills' && <DispatchBills />}

      {tab === 'devices' && (
      <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
      )}

      {/* Register a phone */}
      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
          Register a phone
        </h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Creates a link that works once, for 30 minutes. Open it on that phone and it is set up for good —
          no password, nothing to type again.
        </p>

        <form onSubmit={createInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Whose phone is it? e.g. Papa's phone"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Link2 className="w-4 h-4 mr-2" />
            {busy ? 'Creating…' : 'Create link'}
          </button>
        </form>

        {invite && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="text-sm font-semibold text-gray-900 mb-1">{invite.label}</div>
            <code className="block text-xs text-gray-700 break-all bg-white rounded px-2 py-2 border border-blue-100">
              {invite.url}
            </code>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={copy}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Dispatch slip setup — open this once on the phone:\n${invite.url}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-white"
              >
                Send on WhatsApp
              </a>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              It stops working the moment it is used, and expires at {when(invite.expiresAt)} either way.
            </p>
          </div>
        )}
      </div>

      {/* Registered phones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Registered phones</h3>
          <button onClick={load} className="text-gray-400 hover:text-gray-600" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-sm text-gray-500">Loading…</div>
        ) : devices.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-500">
            No phones registered yet. Create a link above and open it on the phone that will be used at the counter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Phone', 'Status', 'Registered', 'Last used', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {devices.map((d) => (
                  <tr key={d.id} className={d.status === 'revoked' ? 'opacity-60' : ''}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{d.label}</div>
                      {d.userAgent && (
                        <div className="text-xs text-gray-400 truncate max-w-xs" title={d.userAgent}>
                          {d.userAgent}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[d.status]}`}>
                        {d.status === 'invited' && d.inviteExpired ? 'link expired' : d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{when(d.claimedAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{when(d.lastSeenAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {d.status !== 'revoked' && (
                        <button
                          onClick={() => revoke(d)}
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                        >
                          <ShieldOff className="w-4 h-4 mr-1.5" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        A registered phone can see recent bills, attach a slip photo and send an invoice. It cannot reach
        orders, customers, users or anything else in this dashboard — so a phone left on a counter is not a
        way into the business. If one is lost, revoke it here and it stops working immediately.
      </p>
      </>
      )}
    </div>
  );
};

export default CounterDevices;

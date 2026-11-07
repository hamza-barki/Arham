'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Loader2,
  Inbox,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  getSupportMessagesAction,
  updateSupportMessageStatusAction,
  replySupportMessageAction,
  AdminSupportMessageItem,
} from '@/app/actions/admin-support';

export default function AdminSupportInboxPage() {
  const [messages, setMessages] = useState<AdminSupportMessageItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, in_progress: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'closed'>('all');
  const [search, setSearch] = useState('');

  // Reply Modal State
  const [replyModalTarget, setReplyModalTarget] = useState<AdminSupportMessageItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchMessages = useCallback(async (statusTab = activeTab, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await getSupportMessagesAction({
        status: statusTab,
        search: searchQuery,
      });
      if (res.success) {
        setMessages(res.messages);
        setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load support messages', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchMessages(activeTab, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  const handleStatusChange = async (id: string, newStatus: 'new' | 'in_progress' | 'closed') => {
    try {
      const res = await updateSupportMessageStatusAction(id, newStatus);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        fetchMessages();
      } else {
        alert(res.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Status update error');
    }
  };

  const handleOpenReplyModal = (msg: AdminSupportMessageItem) => {
    setReplyModalTarget(msg);
    setReplyText(
      `Assalam-o-Alaikum ${msg.name},\n\nThank you for reaching out to us. Regarding your inquiry:\n\n`
    );
    setReplyError(null);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalTarget) return;

    setSendingReply(true);
    setReplyError(null);

    try {
      const res = await replySupportMessageAction(replyModalTarget.id, replyText);
      if (res.success) {
        setFeedbackNotice(`Reply sent to ${replyModalTarget.email || replyModalTarget.name}!`);
        setReplyModalTarget(null);
        setReplyText('');
        fetchMessages();
      } else {
        setReplyError(res.error || 'Failed to send reply');
      }
    } catch (err: any) {
      setReplyError(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-emerald-800" />
            Support Inbox & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Customer inquiries from the `/contact` form, honeypot protected with one-click reply-by-email.
          </p>
        </div>

        <button
          onClick={() => fetchMessages()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-xs transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {feedbackNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {feedbackNotice}
          </span>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <span>All Messages</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'new'
              ? 'bg-amber-600 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <span>New / Pending</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
            {counts.new}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'in_progress'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <span>In Progress</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
            {counts.in_progress}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('closed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'closed'
              ? 'bg-emerald-800 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <span>Closed / Replied</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
            {counts.closed}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone number (03xx), email, or order #..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-emerald-800 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-black transition shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-800 mb-2" />
          <p className="text-xs text-neutral-500 font-bold">Fetching support messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">No inquiries found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            All customer inquiries in this folder have been addressed!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const rawPhone = msg.phone ? msg.phone.replace(/\D/g, '') : '';
            const waNumber = rawPhone.startsWith('92')
              ? rawPhone
              : rawPhone.startsWith('0')
              ? '92' + rawPhone.slice(1)
              : '92' + rawPhone;

            return (
              <div
                key={msg.id}
                className="bg-white rounded-2xl border border-neutral-200/90 hover:border-emerald-200 hover:shadow-xs transition p-4 sm:p-5 space-y-3"
              >
                {/* Header: Customer, Time, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                      {msg.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-neutral-900">{msg.name}</span>
                        {msg.orderRef && (
                          <Link
                            href={`/admin/orders?search=${encodeURIComponent(msg.orderRef)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200 transition"
                          >
                            <span>Ref: #{msg.orderRef}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Status:</span>
                    <select
                      value={msg.status}
                      onChange={(e) => handleStatusChange(msg.id, e.target.value as any)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getStatusBadge(
                        msg.status
                      )}`}
                    >
                      <option value="new">new</option>
                      <option value="in_progress">in_progress</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </div>

                {/* If Staff Replied */}
                {msg.staffReply && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Staff Reply Sent:
                      </span>
                      {msg.repliedAt && (
                        <span className="text-neutral-400 font-normal">
                          {new Date(msg.repliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-950 whitespace-pre-wrap">{msg.staffReply}</p>
                  </div>
                )}

                {/* Footer Controls: Contacts & Reply */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
                  <div className="flex items-center gap-4 text-neutral-600 flex-wrap">
                    {msg.phone && (
                      <span className="flex items-center gap-1.5 font-mono text-neutral-800">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        {msg.phone}
                      </span>
                    )}

                    {msg.email && (
                      <span className="flex items-center gap-1.5 text-neutral-700">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        {msg.email}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {msg.phone && (
                      <>
                        <a
                          href={`tel:${msg.phone}`}
                          title={`Call ${msg.name}`}
                          className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-emerald-800 hover:border-emerald-300 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={`https://wa.me/${waNumber}?text=Assalam%20o%20Alaikum%20${encodeURIComponent(
                            msg.name
                          )},`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Customer"
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}

                    {msg.email && (
                      <button
                        onClick={() => handleOpenReplyModal(msg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs transition shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply by Email</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-800" />
                  Reply by Email
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  To: <strong>{replyModalTarget.name}</strong> &lt;{replyModalTarget.email}&gt;
                </p>
              </div>
              <button
                onClick={() => setReplyModalTarget(null)}
                className="text-neutral-400 hover:text-neutral-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {replyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {replyError}
              </div>
            )}

            {/* Original message reference */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600">
              <span className="font-bold text-neutral-700 block mb-0.5">Customer asked:</span>
              <p className="italic line-clamp-3">&quot;{replyModalTarget.message}&quot;</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Staff Email Reply
                </label>
                <textarea
                  rows={5}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-emerald-800 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReplyModalTarget(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold disabled:opacity-50"
                >
                  {sendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Email Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


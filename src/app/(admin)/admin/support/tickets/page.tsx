"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LifeBuoy,
  MessageSquare,
  Search,
  Send,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { updateTicketStatusAction } from "@/app/admin-actions";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([
    {
      id: "tk-01",
      ticketNumber: "TK-84912",
      userName: "Dhananjay (Dhanbyte Logistics)",
      userEmail: "dhananjay.win2004@gmail.com",
      category: "SHIPMENT",
      subject: "Courier delivery re-attempt requested for AWB SF37164698496",
      description: "Buyer was not available on first attempt. Customer requested delivery tomorrow after 3 PM.",
      status: "OPEN",
      priority: "HIGH",
      assignedAdmin: "Operations Team",
      createdAt: "2026-08-24 11:45",
      replies: [
        {
          id: "rep-1",
          sender: "USER",
          senderName: "Dhananjay",
          message: "Please escalate with Shadowfax rider for evening slot.",
          createdAt: "2026-08-24 11:45",
        },
      ],
    },
    {
      id: "tk-02",
      ticketNumber: "TK-84910",
      userName: "Pooja Sharma",
      userEmail: "pooja.retail@gmail.com",
      category: "WALLET",
      subject: "Prepaid Wallet recharge query",
      description: "Recharged wallet with ₹5000 via UPI. Confirmation ID UPI892102.",
      status: "RESOLVED",
      priority: "MEDIUM",
      assignedAdmin: "Finance Team",
      createdAt: "2026-08-23 15:20",
      replies: [
        {
          id: "rep-2",
          sender: "ADMIN",
          senderName: "Super Admin",
          message: "Verified and credited to available wallet balance. Thank you!",
          createdAt: "2026-08-23 15:25",
        },
      ],
    },
  ]);

  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendReply() {
    if (!replyText.trim()) return;

    setLoading(true);
    const res = await updateTicketStatusAction(
      activeTicket.id,
      "RESOLVED",
      replyText,
    );
    setLoading(false);

    if (res.ok) {
      toast.success("Reply sent & ticket resolved.");
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? {
                ...t,
                status: "RESOLVED",
                replies: [
                  ...t.replies,
                  {
                    id: `rep-${Date.now()}`,
                    sender: "ADMIN",
                    senderName: "Super Admin",
                    message: replyText,
                    createdAt: "Just now",
                  },
                ],
              }
            : t,
        ),
      );
      setReplyText("");
      setActiveTicket(null);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Support &amp; Helpdesk Desk</h1>
          <p className="text-xs text-slate-500">
            Manage seller tickets across Payments, Wallets, COD disputes, and Courier escalations.
          </p>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Ticket # &amp; Date</th>
                <th className="py-3 px-4">Shipper / User</th>
                <th className="py-3 px-4">Category &amp; Subject</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-slate-900">{t.ticketNumber}</p>
                    <p className="text-[11px] text-slate-400">{t.createdAt}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{t.userName}</p>
                    <p className="text-[11px] text-slate-400">{t.userEmail}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 text-[10px]">
                      {t.category}
                    </span>
                    <p className="font-medium text-slate-800 mt-1 line-clamp-1">{t.subject}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        t.priority === "HIGH" || t.priority === "URGENT"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        t.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800 animate-pulse"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTicket(t)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1 shadow-xs"
                    >
                      <MessageSquare size={13} />
                      <span>Reply</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reply Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {activeTicket.ticketNumber}: {activeTicket.subject}
                </h3>
                <p className="text-xs text-slate-500">{activeTicket.userName} &bull; {activeTicket.userEmail}</p>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-64 overflow-y-auto pr-1">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <p className="font-semibold text-slate-900 mb-1">Issue Description:</p>
                <p className="text-slate-600">{activeTicket.description}</p>
              </div>

              {activeTicket.replies?.map((r: any) => (
                <div
                  key={r.id}
                  className={`rounded-xl p-3 text-xs ${
                    r.sender === "ADMIN"
                      ? "bg-indigo-50 border border-indigo-100 text-indigo-950 ml-4"
                      : "bg-slate-50 border border-slate-100 mr-4"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-slate-900">{r.senderName}</strong>
                    <span className="text-[10px] text-slate-400">{r.createdAt}</span>
                  </div>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 space-y-3">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response to seller..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={loading || !replyText.trim()}
                  onClick={handleSendReply}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Send size={13} />
                  <span>{loading ? "Sending…" : "Send Reply & Resolve"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

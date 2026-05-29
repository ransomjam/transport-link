"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { apiRequest, formatDate } from "../../../lib/api";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      setLoading(true);
      const data = await apiRequest("/messages");
      setMessages(data);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    try {
      await apiRequest(`/messages/${id}/read`, { method: "PATCH" });
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, isRead: true } : msg)));
    } catch (err) {
      alert("Failed to mark as read");
    }
  }

  async function deleteMessage(id) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await apiRequest(`/messages/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      alert("Failed to delete message");
    }
  }

  return (
    <AdminLayout title="Contact Messages">
      {loading ? (
        <p className="text-slate-500">Loading messages...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : messages.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No contact messages found.
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md border p-5 shadow-sm transition ${
                message.isRead ? "border-slate-200 bg-white" : "border-[#049DBF]/30 bg-[#E8F7FA]/50"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#0F2742]">
                    {message.firstName} {message.lastName}
                    {!message.isRead && (
                      <span className="ml-3 inline-flex items-center rounded-full bg-[#0AA66D] px-2 py-0.5 text-xs font-semibold text-white">
                        New
                      </span>
                    )}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <a href={`mailto:${message.email}`} className="hover:text-[#049DBF] hover:underline">
                      {message.email}
                    </a>
                    {message.phone && (
                      <a href={`tel:${message.phone}`} className="hover:text-[#049DBF] hover:underline">
                        {message.phone}
                      </a>
                    )}
                    <span className="text-slate-400">&bull;</span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!message.isRead && (
                    <button
                      onClick={() => markAsRead(message.id)}
                      className="rounded border border-[#049DBF] bg-white px-3 py-1.5 text-xs font-semibold text-[#049DBF] transition hover:bg-[#049DBF] hover:text-white"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {message.service && (
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Service Interest: <span className="font-normal text-slate-600">{message.service}</span>
                </div>
              )}

              <div className="rounded-md bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {message.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

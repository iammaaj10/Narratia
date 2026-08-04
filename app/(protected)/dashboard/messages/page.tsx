"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { fetchDirectMessages, sendDirectMessage, DirectMessage } from "@/lib/social/socialClient";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

interface ChatContact {
  id: string;
  username: string;
  avatar_url: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function MessagesDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipientParam = searchParams.get("recipient");

  const { theme } = useTheme();
  const isLight = theme === "light";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUserAndChats();
  }, [recipientParam]);

  const loadUserAndChats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);

      // Fetch all messages involving the current user from Supabase
      const { data: rawMessages } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const partnerMap = new Map<string, { lastMsg: string; time: string }>();

      if (rawMessages && rawMessages.length > 0) {
        rawMessages.forEach((msg: any) => {
          const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, {
              lastMsg: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
        });
      }

      // If a recipient parameter was passed in URL (e.g. from a profile page), ensure they exist in map
      if (recipientParam && !partnerMap.has(recipientParam) && recipientParam !== user.id) {
        partnerMap.set(recipientParam, { lastMsg: "New Conversation", time: "Just now" });
      }

      // Load profile details for each unique partner
      const loadedContacts: ChatContact[] = [];
      for (const [partnerId, meta] of Array.from(partnerMap.entries())) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", partnerId)
          .maybeSingle();

        loadedContacts.push({
          id: partnerId,
          username: profile?.username || "Creator",
          avatar_url: profile?.avatar_url || null,
          lastMessage: meta.lastMsg,
          lastMessageTime: meta.time,
        });
      }

      setContacts(loadedContacts);

      // Set active contact
      let initialContact: ChatContact | null = null;
      if (recipientParam) {
        initialContact = loadedContacts.find((c) => c.id === recipientParam) || null;
      }
      if (!initialContact && loadedContacts.length > 0) {
        initialContact = loadedContacts[0];
      }

      setActiveContact(initialContact);

      if (initialContact) {
        await loadMessagesForContact(initialContact.id, user.id);
      }
    } catch (err) {
      console.error("Error loading chat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForContact = async (contactId: string, currentUserId: string) => {
    const dms = await fetchDirectMessages(currentUserId, contactId);
    setMessages(dms);
  };

  const handleSelectContact = async (contact: ChatContact) => {
    setActiveContact(contact);
    if (currentUser) {
      await loadMessagesForContact(contact.id, currentUser.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact || !currentUser) return;

    setSending(true);
    const content = inputMessage.trim();
    setInputMessage("");

    const newMessage: DirectMessage = {
      id: `msg-${Date.now()}`,
      sender_id: currentUser.id,
      recipient_id: activeContact.id,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Update contacts sidebar last message preview
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, lastMessage: content, lastMessageTime: "Just now" }
          : c
      )
    );

    // Save to real database
    await sendDirectMessage(currentUser.id, activeContact.id, content);
    setSending(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? "bg-slate-50" : "bg-[#06070a]"}`}>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"
    }`}>
      {/* ── HEADER ── */}
      <header className={`h-[64px] border-b px-6 flex items-center justify-between backdrop-blur-xl ${
        isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
      }`}>
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">N</a>
          <h1 className="font-bold text-base outfit">Creator Messages</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-xs font-semibold text-slate-400 hover:text-indigo-400">Dashboard</a>
          <a href="/community" className="text-xs font-semibold text-indigo-400 hover:underline">Community Hub</a>
          <ThemeToggle />
        </div>
      </header>

      {/* ── MAIN CHAT WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden max-w-[1280px] w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left Contacts Sidebar */}
        <aside className={`w-full sm:w-80 rounded-3xl border p-4 flex flex-col backdrop-blur-xl ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
        }`}>
          <div className="pb-3 border-b border-slate-100 dark:border-white/10 mb-3 flex items-center justify-between">
            <h2 className="font-bold text-sm outfit">Conversations</h2>
            <span className="text-[10px] font-mono text-slate-400">{contacts.length} Active</span>
          </div>

          {contacts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="text-2xl">💬</div>
              <p className="text-xs font-semibold text-slate-400">No active conversations yet.</p>
              <a
                href="/community"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all"
              >
                Find Creators
              </a>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 ${
                    activeContact?.id === contact.id
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : isLight
                      ? "hover:bg-slate-100 text-slate-700"
                      : "hover:bg-white/5 text-slate-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
                    {contact.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold truncate">@{contact.username}</span>
                      <span className="text-[10px] opacity-70 font-mono">{contact.lastMessageTime}</span>
                    </div>
                    <p className="text-[11px] opacity-80 truncate mt-0.5">{contact.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right Active Message Thread */}
        <main className={`flex-1 rounded-3xl border flex flex-col overflow-hidden backdrop-blur-xl ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
        }`}>
          {activeContact ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                    {activeContact.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm outfit">@{activeContact.username}</h3>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Creator
                    </span>
                  </div>
                </div>

                <a
                  href={`/creator/${activeContact.username}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-indigo-500 text-indigo-400 transition-all"
                >
                  View Profile
                </a>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                    <div className="text-3xl">👋</div>
                    <p className="font-semibold">Start of your conversation with @{activeContact.username}</p>
                    <p className="text-[11px] text-slate-500">Send a message below to outline story ideas or discuss collaboration!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-none"
                              : isLight
                              ? "bg-slate-100 text-slate-800 rounded-bl-none"
                              : "bg-white/[0.06] text-slate-200 border border-white/10 rounded-bl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-white/10 flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message @${activeContact.username}...`}
                  className={`flex-1 px-4 py-3 rounded-2xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                  }`}
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all outfit"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 space-y-3">
              <div className="text-3xl">💬</div>
              <p className="font-semibold">Select a conversation or find authors on the Community Hub</p>
              <a
                href="/community"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all outfit"
              >
                Explore Community
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, SendHorizontal, Sparkles, Users, ChevronLeft, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AppRole } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Message = {
  role: "user" | "ai" | "human_other";
  content: string;
};

type Contact = {
  id: string;
  name: string;
  patientInfo: string;
  status: string;
  isOnline: boolean;
  patient_id: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  doctor: { full_name: string } | Array<{ full_name: string }> | null;
  caregiver: { full_name: string } | Array<{ full_name: string }> | null;
};

type HumanMessageRow = {
  patient_id: string;
  content: string;
  sender_role: string;
  created_at: string; // 🟢 THÊM CREATED_AT ĐỂ LẤY THỜI GIAN
};

export function AiChatPanel({ role }: { role: AppRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "human">("ai");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicContacts, setDynamicContacts] = useState<Contact[]>([]);
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
  // 🟢 THÊM STATE LƯU THỜI GIAN ĐỂ SẮP XẾP LÊN ĐẦU
  const [latestTimes, setLatestTimes] = useState<Record<string, number>>({}); 

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  
  const viewStateRef = useRef({ isOpen, activeTab, selectedContactId: selectedContact?.patient_id });
  useEffect(() => {
    viewStateRef.current = { isOpen, activeTab, selectedContactId: selectedContact?.patient_id };
  }, [isOpen, activeTab, selectedContact]);

  const [aiMessages, setAiMessages] = useState<Message[]>([
    { role: "ai", content: "Xin chào! Tôi là Trợ lý AI trung tâm. Tôi có thể giúp gì cho bạn hôm nay?" }
  ]);
  const [humanMessages, setHumanMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const initData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setCurrentUser({ id: authData.user.id });

        const { data: profiles, error } = await supabase
          .from("elderly_profiles")
          .select(`
            id, 
            full_name,
            doctor:users!doctor_id(full_name),
            caregiver:users!caregiver_id(full_name)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ LỖI SUPABASE JOIN:", error.message);
          return;
        }

        if (profiles) {
          const mappedContacts: Contact[] = (profiles as ProfileRow[]).map((p) => {
            const docName = Array.isArray(p.doctor) ? p.doctor[0]?.full_name : p.doctor?.full_name;
            const careName = Array.isArray(p.caregiver) ? p.caregiver[0]?.full_name : p.caregiver?.full_name;

            // 🟢 ĐÃ FIX: Chỉ hiện tên thật, loại bỏ chữ "Gia đình (BN: ...)"
            let contactName = "Chưa có tên (Check lại RLS bảng users)";
            if (role === "doctor") {
              contactName = careName ? careName : "Chưa có tên Người nhà";
            } else if (role === "caregiver") {
              contactName = docName ? `BS. ${docName}` : "Chưa có tên Bác sĩ";
            }

            return {
              id: p.id,
              patient_id: p.id,
              name: contactName,
              patientInfo: `Hồ sơ: ${p.full_name}`,
              status: "Sẵn sàng kết nối",
              isOnline: true
            };
          });
          setDynamicContacts(mappedContacts);

          // 🟢 Lấy thêm created_at để sắp xếp
          const { data: msgs } = await supabase
            .from("human_messages")
            .select("patient_id, content, sender_role, created_at")
            .order("created_at", { ascending: false })
            .limit(500);

          if (msgs) {
            const latest: Record<string, string> = {};
            const unread: Record<string, number> = {};
            const times: Record<string, number> = {};

            msgs.forEach((m: HumanMessageRow) => {
              if (!latest[m.patient_id]) {
                latest[m.patient_id] = m.sender_role === role ? `Bạn: ${m.content}` : m.content;
                times[m.patient_id] = new Date(m.created_at).getTime();
                if (m.sender_role !== role) unread[m.patient_id] = 1;
              }
            });
            setLatestMessages(latest);
            setUnreadCounts(unread);
            setLatestTimes(times);
          }
        }
      }
    };
    initData();
  }, [supabase, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, humanMessages, isOpen, activeTab, selectedContact]);

  useEffect(() => {
    const channel = supabase
      .channel("global_human_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "human_messages" },
        (payload) => {
          const newMsg = payload.new as { patient_id: string; sender_role: string; content: string; created_at: string };
          const currentView = viewStateRef.current;

          setLatestMessages((prev) => ({
            ...prev,
            [newMsg.patient_id]: newMsg.sender_role === role ? `Bạn: ${newMsg.content}` : newMsg.content
          }));
          
          // 🟢 CẬP NHẬT THỜI GIAN MỚI NHẤT ĐỂ ĐẨY LÊN ĐẦU
          setLatestTimes((prev) => ({
            ...prev,
            [newMsg.patient_id]: new Date(newMsg.created_at || Date.now()).getTime()
          }));

          if (newMsg.sender_role !== role) {
            const isCurrentlyChatting = 
              currentView.isOpen && 
              currentView.activeTab === "human" && 
              currentView.selectedContactId === newMsg.patient_id;

            if (isCurrentlyChatting) {
              setHumanMessages((prev) => [...prev, { role: "human_other", content: newMsg.content }]);
            } else {
              setUnreadCounts((prev) => ({
                ...prev,
                [newMsg.patient_id]: (prev[newMsg.patient_id] || 0) + 1 
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, role]);

  useEffect(() => {
    if (activeTab !== "human" || !selectedContact || !selectedContact.patient_id) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("human_messages")
        .select("*")
        .eq("patient_id", selectedContact.patient_id)
        .order("created_at", { ascending: true });

      if (data && !error) {
        const formattedMsgs: Message[] = (data as Array<{ sender_role: string; content: string }>).map((m) => ({
          role: (m.sender_role === role ? "user" : "human_other") as "user" | "human_other",
          content: m.content
        }));
        setHumanMessages(formattedMsgs);
      }
    };
    fetchHistory();
  }, [activeTab, selectedContact, role, supabase]);

  const handleSelectContact = (c: Contact) => {
    setSelectedContact(c);
    setHumanMessages([]); 
    setUnreadCounts(prev => ({ ...prev, [c.patient_id]: 0 }));
  };

  const getQuickActions = () => {
    if (activeTab === "human") return ["Dạ vâng", "Cảm ơn", "Gọi lại giúp tôi"];
    switch (role) {
      case "doctor": return ["Tóm tắt bệnh án", "Biểu đồ sinh tồn", "Phân tích đơn thuốc"];
      case "caregiver": return ["Báo cáo hôm nay", "Kiểm tra lừa đảo", "Lịch uống thuốc"];
      case "station": return ["Gọi bác sĩ", "Báo động SOS", "Tôi mệt"];
      default: return ["Hỗ trợ hệ thống"];
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    if (activeTab === "ai") {
      setAiMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai-assistant/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, role: role }),
        });
        const data = await response.json();
        if (data.success) {
          setAiMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
        } else {
          setAiMessages((prev) => [...prev, { role: "ai", content: "Lỗi: " + (data.error || "Không thể kết nối AI.") }]);
        }
      } catch (error) {
        console.error("Lỗi gọi API AI:", error);
        setAiMessages((prev) => [...prev, { role: "ai", content: "Lỗi đường truyền mạng. Vui lòng thử lại." }]);
      } finally {
        setIsLoading(false);
      }

    } else {
      if (!selectedContact || !selectedContact.patient_id) return;
      
      setHumanMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");

      const { error } = await supabase.from("human_messages").insert({
        patient_id: selectedContact.patient_id,
        sender_id: currentUser?.id || null,
        sender_role: role,
        content: text
      });

      if (error) {
        console.error("Lỗi gửi tin nhắn Supabase:", error);
        setHumanMessages((prev) => [...prev, { role: "human_other", content: "❌ Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối." }]);
      }
    }
  };

  const currentMessages = activeTab === "ai" ? aiMessages : humanMessages;

  // 🟢 THUẬT TOÁN SẮP XẾP: Ai có tin nhắn mới nhất sẽ nhảy lên đầu
  const sortedContacts = [...dynamicContacts].sort((a, b) => {
    const timeA = latestTimes[a.patient_id] || 0;
    const timeB = latestTimes[b.patient_id] || 0;
    return timeB - timeA;
  });

  return (
    <>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-all z-[9999] group">
          <Bot className="size-6 text-white group-hover:scale-110 transition-transform" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white shadow-sm animate-bounce">
              {totalUnread}
            </span>
          )}
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] sm:w-[420px] h-[80vh] sm:h-[600px] bg-background border border-border shadow-2xl rounded-2xl flex flex-col z-[9999] overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between bg-blue-600 p-4 border-b shrink-0">
            <div className="flex items-center gap-3 font-semibold text-white min-w-0">
              {activeTab === "human" && selectedContact ? (
                <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)} className="h-8 w-8 rounded-full text-white hover:bg-white/20 -ml-2 shrink-0">
                  <ChevronLeft className="size-5" />
                </Button>
              ) : (
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-sm shrink-0">
                  <Sparkles className="size-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold tracking-tight truncate">
                  {activeTab === "human" && selectedContact ? selectedContact.name : "Trung tâm Liên lạc"}
                </h3>
                {activeTab === "human" && selectedContact ? (
                   <p className="text-xs text-blue-100 flex items-center gap-1 truncate">
                     {selectedContact.isOnline && <span className="size-2 shrink-0 rounded-full bg-green-400"></span>}
                     {selectedContact.patientInfo}
                   </p>
                ) : (
                  <p className="text-xs text-blue-100 flex items-center gap-1">Chế độ: {role}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full text-white hover:bg-white/20 shrink-0">
              <X className="size-5" />
            </Button>
          </div>

          <div className="flex border-b bg-muted/20 shrink-0">
            <button onClick={() => { setActiveTab('ai'); setSelectedContact(null); }} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ai' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Bot className="size-4"/> Trợ lý AI
            </button>
            <button onClick={() => setActiveTab('human')} className={`relative flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'human' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Users className="size-4"/> {role === 'doctor' ? 'Người nhà' : 'Bác sĩ'}
              {totalUnread > 0 && activeTab !== 'human' && (
                <span className="absolute top-2 right-6 size-2.5 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>

          {activeTab === "human" && !selectedContact ? (
            <div className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900">
              <div className="mb-3 px-1 text-xs font-black text-slate-500 uppercase tracking-wider">Danh bạ liên hệ</div>
              
              {sortedContacts.length === 0 ? (
                <div className="text-center text-xs text-slate-500 mt-10">Chưa có bệnh nhân nào được liên kết.</div>
              ) : (
                // 🟢 ĐÃ FIX: Sử dụng danh sách sortedContacts đã được sắp xếp
                sortedContacts.map(c => {
                  const unread = unreadCounts[c.patient_id] || 0;
                  const isUnread = unread > 0;
                  
                  return (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectContact(c)} 
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition shadow-sm mb-2 group ${isUnread ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 border' : 'bg-white border-transparent hover:bg-blue-50/50 hover:border-blue-200 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:border-slate-700 border'}`}
                  >
                    <div className="relative size-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 group-hover:scale-105 transition-transform">
                      <UserRound className="size-5"/>
                      {c.isOnline && !isUnread && <span className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-[14px] truncate ${isUnread ? 'font-black text-blue-700 dark:text-blue-400' : 'font-bold text-slate-900 dark:text-white'}`}>
                          {c.name}
                        </p>
                        {isUnread && (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ml-2">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate bg-blue-50 dark:bg-blue-900/20 inline-block px-1.5 py-0.5 rounded-md">
                        {c.patientInfo}
                      </p>
                      <p className={`text-[13px] mt-1.5 truncate transition-all ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                        {latestMessages[c.patient_id] || "Bấm để bắt đầu trò chuyện..."}
                      </p>
                    </div>
                  </div>
                )})
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                {currentMessages.length === 0 && activeTab === "human" && (
                   <div className="text-center text-xs text-slate-500 mt-10">Bắt đầu cuộc trò chuyện mới...</div>
                )}
                {currentMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-slate-800 border text-slate-800 dark:text-slate-200 rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3 bg-white dark:bg-slate-950 border-t border-border/50 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {getQuickActions().map((action, idx) => (
                    <Button key={idx} variant="outline" size="sm" className="whitespace-nowrap text-xs rounded-full h-8 border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors" onClick={() => handleSend(action)}>
                      {action}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-4 pt-0 bg-white dark:bg-slate-950 flex gap-2 shrink-0">
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={activeTab === 'ai' ? "Hỏi AI..." : "Nhập tin nhắn..."} className="min-h-[52px] max-h-32 resize-none rounded-xl bg-slate-50 dark:bg-slate-900 focus-visible:ring-blue-500" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }} />
                <Button onClick={() => handleSend(input)} size="icon" className="size-[52px] shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={!input.trim() || isLoading}>
                  <SendHorizontal className={`size-5 ${isLoading ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
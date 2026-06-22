"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { sendToAIAssistant } from "@/app/actions/ai";
import type { Database } from "@/database";
import type { LucideIcon } from "lucide-react";
import { Settings, UserRound, Bot, Send, AlertCircle, Home, Pill, Activity, Search } from "lucide-react";

type Profile = Database["public"]["Tables"]["elderly_profiles"]["Row"];
type Message = { id: string; role: "ai" | "user"; content: string; timestamp: Date; };

// Đồng bộ sidebar items và active AI Care
const sidebarItems = [ 
  { href: "/caregiver", label: "Trang chính", icon: Home, active: false }, 
  { href: "/caregiver/prescriptions", label: "Lịch thuốc", icon: Pill, active: false }, 
  { href: "/caregiver/ai-care", label: "AI Care", icon: Bot, active: true }, 
];

// Khóa cứng component SidebarItem của trang Dashboard
function SidebarItem({ href, label, icon: Icon, active = false }: { href: string; label: string; icon: LucideIcon; active?: boolean; }) {
  return (
    <Link href={href} className={["flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition", active ? "bg-blue-100 text-blue-900 shadow-sm dark:bg-blue-500/20 dark:text-white" : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"].join(" ")}>
      <Icon className="size-5 shrink-0" strokeWidth={2.4} />
      <span>{label}</span>
    </Link>
  );
}

export default function CaregiverAIBotPage() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "welcome-1", 
      role: "ai", 
      content: "Xin chào! Tôi là Trợ lý AI Care. Tôi có thể giúp bạn tóm tắt tình hình sức khỏe, giải thích lịch uống thuốc hoặc lập kế hoạch chăm sóc cho người thân. Bạn cần hỗ trợ gì hôm nay?", 
      timestamp: new Date() 
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const { data } = await getElderlyProfiles();
        if (data && data.length > 0) {
          setPatients(data);
          // Tự động chọn nếu chỉ có 1 người thân
          if (data.length === 1) {
            setSelectedPatient(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading profiles:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfiles();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const relativeContext = selectedPatient 
        ? `Ngữ cảnh: Đang hỏi về người thân có ID: ${selectedPatient}. ` 
        : "";
      
      const prompt = relativeContext + userMsg.content;

      const response = await sendToAIAssistant({
        elderly_profile_id: selectedPatient || "",
        message: prompt
      });
      const aiText = response.error
        ? null
        : response.data?.output || response.data?.text || response.data?.message || (typeof response.data === "string" ? response.data : JSON.stringify(response.data));
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response.error
          ? `⚠️ ${response.error}`
          : aiText || "Xin lỗi, tôi đang gặp chút sự cố khi kết nối. Bạn thử lại sau nhé.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Hệ thống đang bận hoặc mất kết nối. Vui lòng kiểm tra lại mạng và thử lại.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      
      {/* TOPBAR - KHÓA CỨNG TỪ DASHBOARD */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex h-full shrink-0 items-center gap-4 border-r border-transparent pr-4 md:w-56 md:border-slate-200 dark:md:border-white/8">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg dark:bg-blue-500">HCS</div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-black leading-4 text-slate-900 dark:text-white">Home Care Station</p>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Trung tâm người nhà</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center px-4">
          <div className="hidden h-11 w-full max-w-150 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/4 md:flex">
            <Search className="size-5 shrink-0 text-blue-600 dark:text-blue-300" strokeWidth={2.4} />
            <span className="truncate text-sm font-medium">Tìm tên bệnh nhân, lịch thuốc hoặc cảnh báo...</span>
          </div>
        </div>
        <div className="flex h-full shrink-0 items-center gap-2 lg:gap-3">
          <ThemeToggle />
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-200 dark:border-white/10 dark:bg-white/4">
            <Settings className="size-4" />
          </button>
          <form action="/logout" method="post">
            <button type="submit" className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 dark:bg-blue-500">Đăng xuất</button>
          </form>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[244px_1fr]">
        
        {/* LEFT SIDEBAR - KHÓA CỨNG TỪ DASHBOARD */}
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-slate-50/50 px-3 py-4 dark:border-white/8 dark:bg-slate-950/50 lg:block">
          <nav className="space-y-1">
            {sidebarItems.map((item) => <SidebarItem key={item.label} {...item} />)}
          </nav>
        </aside>

        {/* NỘI DUNG CHÍNH (CHAT & RIGHT SIDEBAR) */}
        <main className="flex min-w-0 flex-1 overflow-hidden bg-white dark:bg-slate-950">
          
          {/* KHUNG CHAT */}
          <div className="flex flex-1 flex-col relative bg-slate-50/50 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)]">
            
            {/* Header chat phụ */}
            <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-3 dark:border-white/5">
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white">AI Care Assistant</h1>
                <p className="text-[11px] font-medium text-slate-500">Giải đáp thắc mắc & Hỗ trợ chăm sóc 24/7</p>
              </div>
            </div>

            {/* Context Alert */}
            {!selectedPatient && patients.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Vui lòng chọn người thân ở cột bên phải để AI tư vấn chính xác hơn.</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border text-blue-600 dark:bg-slate-800 dark:border-white/10 dark:text-blue-400"}`}>
                    {msg.role === "user" ? <UserRound className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <span className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider">
                      {msg.role === "user" ? "Bạn" : "AI Care"} • {msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className={`rounded-2xl px-5 py-3.5 text-[15px] font-medium leading-relaxed shadow-sm ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-tr-sm dark:bg-blue-600" 
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm dark:bg-slate-900/80 dark:border-white/10 dark:text-slate-200"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4 max-w-3xl">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border text-blue-600 shadow-sm dark:bg-slate-800 dark:border-white/10 dark:text-blue-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider">AI Care</span>
                    <div className="rounded-2xl px-5 py-4 bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center gap-1.5 dark:bg-slate-900/80 dark:border-white/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200 dark:bg-slate-950/80 dark:border-white/8">
              <div className="max-w-4xl mx-auto flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all dark:bg-slate-900 dark:border-white/10">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Hỏi AI về lịch thuốc, chỉ số sức khỏe của người thân..."
                  className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] font-medium outline-none placeholder:text-slate-400 dark:text-white"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Send className="h-5 w-5 ml-0.5" />
                </button>
              </div>
              <p className="text-center text-[11px] font-medium text-slate-400 mt-3">
                AI có thể mắc sai lầm. Xin vui lòng tham khảo ý kiến bác sĩ cho các quyết định y tế quan trọng.
              </p>
            </div>
          </div>

          {/* RIGHT SIDEBAR - CHỌN NGƯỜI THÂN */}
          <div className="hidden w-72 flex-col border-l border-slate-200 bg-slate-50/50 dark:border-white/8 dark:bg-slate-950/50 xl:flex">
            <div className="p-5 border-b border-slate-200 dark:border-white/8">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider dark:text-white">Người thân</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Chọn người thân để AI phân tích</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="text-center text-sm font-medium text-slate-400 py-8">Đang tải hồ sơ...</div>
              ) : patients.length > 0 ? (
                patients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient.id)}
                    className={`flex w-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
                      selectedPatient === patient.id 
                        ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-200 dark:border-blue-500/50 dark:bg-blue-500/10 dark:ring-blue-500/30" 
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/5 dark:bg-slate-900/50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg ${
                        selectedPatient === patient.id ? "bg-blue-200/50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {patient.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className={`text-[15px] font-black ${selectedPatient === patient.id ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-white"}`}>
                          {patient.full_name}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                          <Activity className="h-3 w-3" />
                          Đang theo dõi
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-sm font-medium text-slate-400 py-8">
                  Chưa có hồ sơ người thân nào.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
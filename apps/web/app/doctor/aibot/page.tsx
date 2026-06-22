"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { doctorSidebarItems } from "@/lib/constants/doctor-sidebar";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { sendToAIAssistant } from "@/app/actions/ai";
import type { Database } from "@/database";
import {
  Bell, Search, Settings, UserRound, Bot, Send, AlertCircle, Activity
} from "lucide-react";

type Profile = Database["public"]["Tables"]["elderly_profiles"]["Row"];
type Message = { id: string; role: "ai" | "doctor"; content: string; timestamp: Date; };

export default function DoctorAIBotPage() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [input, setInput] = useState("");
  const [searchContext, setSearchContext] = useState("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome-1", role: "ai", content: "Xin chào Bác sĩ. Tôi là Trợ lý AI. Vui lòng chọn một bệnh nhân ở danh sách bên phải để thiết lập ngữ cảnh bệnh lý trước khi trò chuyện.", timestamp: new Date() }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const { data } = await getElderlyProfiles();
        if (data) setPatients(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bệnh nhân:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    (p.full_name || "").toLowerCase().includes(searchContext.toLowerCase()) || 
    (p.medical_conditions?.join(" ") || "").toLowerCase().includes(searchContext.toLowerCase())
  );

  // HÀM XỬ LÝ GỬI TIN NHẮN ĐÃ ĐƯỢC KẾT NỐI VỚI n8n
  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    const newMessage: Message = { id: Date.now().toString(), role: "doctor", content: userMessage, timestamp: new Date() };
    
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);
    
    // Khởi tạo tin nhắn trạng thái chờ của AI
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingId, role: "ai", content: "Đang phân tích dữ liệu...", timestamp: new Date() }]);

    try {
      // Gửi sang Server Action
      const res = await sendToAIAssistant({
        elderly_profile_id: selectedPatient || "",
        message: userMessage
      });

      setMessages(prev => prev.map(msg => {
        if (msg.id === loadingId) {
          if (res.error) {
            return { ...msg, content: `⚠️ Lỗi: ${res.error}` };
          }
          // Bắt các key trả về phổ biến từ Langchain/n8n (thường là output, text hoặc nguyên khối json)
          const aiText = res.data?.output || res.data?.text || res.data?.message || (typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
          return { ...msg, content: aiText || "Không nhận được phản hồi rõ ràng từ AI Agent." };
        }
        return msg;
      }));
    } catch {
      setMessages(prev => prev.map(msg => msg.id === loadingId ? { ...msg, content: "⚠️ Hệ thống đang quá tải hoặc gặp lỗi không xác định." } : msg));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 flex w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-md transition-colors duration-300 dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/doctor" className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-950/40">HCS</div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-[13px] font-black leading-4 text-slate-900 dark:text-white">Home Care</p>
              <p className="truncate text-[11px] font-semibold text-slate-500">Doctor</p>
            </div>
          </Link>
          <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 lg:block"></div>
          <div className="hidden lg:block">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300/80">AI Workspace</p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 dark:text-white xl:text-2xl">Trợ lý AI Phân tích</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <div className="hidden h-11 w-64 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/4 dark:text-slate-400 xl:flex 2xl:w-80"><Search className="mr-2 size-4 shrink-0 text-blue-600 dark:text-blue-300" /><span className="truncate text-xs">Tìm bệnh nhân, chỉ số, cảnh báo...</span></div>
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"><Bell className="size-4" /></button>
          <ThemeToggle />
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"><Settings className="size-4" /></button>
          <form action="/logout" method="post"><button type="submit" className="whitespace-nowrap h-11 shrink-0 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-950/40 dark:hover:bg-blue-400">Đăng xuất</button></form>
        </div>
      </header>

      {/* 2. BODY GRID */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)]">
        
        {/* SIDEBAR */}
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-white px-3 pb-4 pt-4 transition-colors duration-300 dark:border-white/8 dark:bg-slate-950/95 lg:flex lg:flex-col">
          <nav className="space-y-2">
            {doctorSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/doctor/aibot"; 
              return (
                <Link key={item.label} href={item.href} className={["group relative flex flex-col items-center gap-1 rounded-3xl border px-2 py-3 text-center transition", isActive ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-white dark:shadow-lg dark:shadow-blue-950/30" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/4 dark:hover:text-white"].join(" ")}>
                  <span className={["grid size-9 place-items-center rounded-2xl transition-colors", isActive ? "bg-blue-600 text-white dark:bg-blue-500" : "bg-slate-100 text-slate-500 group-hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:text-white"].join(" ")}><Icon className="size-4" /></span>
                  <span className="text-[11px] font-bold leading-4">{item.label}</span>
                  {item.badge ? <span className="absolute right-1.5 top-1.5 rounded-full border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[9px] font-black text-orange-700 dark:border-orange-300/30 dark:bg-orange-500/20 dark:text-orange-200">{item.badge}</span> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 3. MAIN CONTENT */}
        <main className="flex min-w-0 flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:flex-row">
            
           {/* KHU VỰC TRÁI: GIAO DIỆN CHAT */}
           <div className="flex flex-1 flex-col overflow-hidden p-4 lg:p-5">
             <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/8 dark:bg-slate-950/60 dark:shadow-2xl dark:shadow-black/20">
                
                {/* Header */}
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-6 dark:border-white/5">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <Bot className="size-4.5 text-blue-600 dark:text-blue-400" /> AI Assistant {isTyping && <span className="ml-2 text-xs text-blue-500 animate-pulse">(Đang gõ...)</span>}
                  </span>
                  {!selectedPatient && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-orange-200/50 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-400">
                      <AlertCircle className="size-3.5" /> Chưa gán hồ sơ
                    </div>
                  )}
                </div>
                
                {/* Luồng tin nhắn */}
                <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === "doctor" ? "flex-row-reverse" : ""}`}>
                      <div className={`grid size-9 shrink-0 place-items-center rounded-2xl border ${msg.role === "doctor" ? "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500" : "bg-slate-100 border-slate-200 text-blue-600 dark:bg-white/5 dark:border-white/10 dark:text-blue-400"}`}>
                        {msg.role === "doctor" ? <UserRound className="size-4.5" /> : <Bot className="size-4.5" />}
                      </div>
                      <div className={`flex flex-col ${msg.role === "doctor" ? "items-end" : "items-start"} max-w-[85%]`}>
                        <div className={`whitespace-pre-wrap rounded-3xl px-5 py-3 text-[14px] leading-relaxed shadow-sm ${msg.role === "doctor" ? "bg-blue-600 text-white rounded-tr-sm dark:bg-blue-500" : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm dark:bg-white/5 dark:border-white/5 dark:text-slate-200"}`}>
                          {msg.content}
                        </div>
                        <span className="mt-1.5 text-[10px] font-bold text-slate-400">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input nhập */}
                <div className="shrink-0 border-t border-slate-100 p-4 dark:border-white/5">
                  <div className={`relative mx-auto flex w-full items-end gap-3 rounded-2xl border p-2 transition-colors duration-200 ${isTyping ? "border-slate-100 bg-slate-50/50 dark:border-white/5 dark:bg-black/10" : "border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500 dark:border-white/10 dark:bg-black/20 dark:focus-within:border-blue-500 dark:focus-within:bg-slate-950"}`}>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isTyping}
                      placeholder={isTyping ? "AI đang trả lời..." : (selectedPatient ? "Bắt đầu đặt câu hỏi phân tích..." : "Nhập yêu cầu cho AI...")}
                      className="custom-scrollbar max-h-32 min-h-[44px] w-full resize-none bg-transparent py-2.5 pl-3 pr-2 text-sm outline-none disabled:opacity-50 dark:text-white"
                      rows={1}
                    />
                    <button onClick={handleSendMessage} disabled={!input.trim() || isTyping} className="mb-0.5 mr-0.5 grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-400">
                      <Send className="size-4.5 ml-[-2px]" />
                    </button>
                  </div>
                </div>
             </div>
           </div>

           {/* KHU VỰC PHẢI: HỒ SƠ */}
           <div className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white/50 dark:border-white/8 dark:bg-black/10 lg:w-80 lg:border-l lg:border-t-0">
             <div className="shrink-0 border-b border-slate-200 p-5 dark:border-white/8">
               <h2 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white">
                 <Activity className="size-4 text-blue-600 dark:text-blue-400" /> Hồ sơ bệnh nhân
               </h2>
               <div className="relative mt-4">
                 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Tìm tên hoặc bệnh nền..." value={searchContext} onChange={(e) => setSearchContext(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/4 dark:text-white" />
               </div>
             </div>
             
             <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-3">
               {loading ? (
                 <div className="flex flex-col items-center justify-center pt-10 text-slate-400">
                   <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2"></div>
                   <p className="text-xs font-semibold">Đang tải hồ sơ thực tế...</p>
                 </div>
               ) : (
                 filteredPatients.map((patient) => {
                   const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : null;
                   const conditionsText = patient.medical_conditions && patient.medical_conditions.length > 0 
                     ? patient.medical_conditions.join(", ") 
                     : "Không có bệnh nền";

                   return (
                     <button key={patient.id} onClick={() => setSelectedPatient(patient.id)} className={`flex w-full flex-col items-start gap-1.5 rounded-[20px] border p-4 text-left transition ${selectedPatient === patient.id ? "border-blue-300 bg-blue-50 shadow-md dark:border-blue-500/50 dark:bg-blue-500/20" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/10"}`}>
                       <div className="flex w-full items-center justify-between">
                         <span className={`text-sm font-black ${selectedPatient === patient.id ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-white"}`}>{patient.full_name}</span>
                         <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${selectedPatient === patient.id ? "bg-blue-200/50 text-blue-800 dark:bg-blue-400/20 dark:text-blue-200" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{age ? `${age} tuổi` : "Chưa rõ"}</span>
                       </div>
                       <span className={`text-xs font-medium line-clamp-2 ${selectedPatient === patient.id ? "text-blue-700/80 dark:text-blue-200/70" : "text-slate-500 dark:text-slate-400"}`}>{conditionsText}</span>
                     </button>
                   );
                 })
               )}
               {!loading && filteredPatients.length === 0 && <p className="text-center text-xs italic text-slate-400">Không tìm thấy bệnh nhân.</p>}
             </div>
           </div>

        </main>
      </div>

    </div>
  );
}
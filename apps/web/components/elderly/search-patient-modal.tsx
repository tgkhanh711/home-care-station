"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X, UserPlus, Loader2, UserRound, Phone, Plus } from "lucide-react";
import { searchElderlyProfiles, linkDoctorToElderly } from "@/app/actions/elderly";

type SearchPatientResult = {
  id: string;
  full_name: string;
  dob?: string | null;
  gender?: string | null;
  caregiver_name: string;
  caregiver_phone: string;
  is_linked: boolean;
};

export function SearchPatientModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPatientResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const latestRequest = useRef<number>(0);

  const executeSearch = async (searchQuery: string) => {
    if (searchQuery.trim() === "") {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const requestId = Date.now();
    latestRequest.current = requestId;

    setIsSearching(true);
    const res = await searchElderlyProfiles(searchQuery);
    
    if (latestRequest.current === requestId) {
      if (res.data) {
        setResults(res.data);
      } else {
        setResults([]);
      }
      setHasSearched(true);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 100); 

    return () => clearTimeout(timer); 
  }, [query]);

  const handleManualSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch(query); 
  };

  const handleLink = async (elderlyId: string) => {
    setLinkingId(elderlyId);
    const res = await linkDoctorToElderly(elderlyId);
    setLinkingId(null);

    if (res.error) {
      alert("Lỗi: " + res.error);
    } else {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      setHasSearched(false);
      router.refresh(); 
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        <UserPlus className="size-4" />
        Tìm & Thêm bệnh nhân
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          
          {/* ĐÃ FIX: Lớp Overlay được tinh chỉnh màu sắc đẹp cho cả 2 mode và blur đồng nhất */}
          <div 
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm dark:bg-slate-950/80 transition-all"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:border dark:border-white/10 dark:bg-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Tìm kiếm bệnh nhân</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleManualSearch} className="relative mb-6 flex items-center">
                <Search className="absolute left-4 size-5 text-slate-400" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập tên bệnh nhân cần tìm..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-32 text-sm font-medium outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                />
                
                <div className="absolute right-2 flex items-center gap-2">
                  {isSearching ? (
                    <Loader2 className="size-4 animate-spin text-blue-500" />
                  ) : hasSearched && results.length > 0 ? (
                    <span className="mr-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">{results.length} kết quả</span>
                  ) : null}
                  
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="rounded-xl bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/40"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>

              <div className="custom-scrollbar max-h-[50vh] space-y-3 overflow-y-auto pr-2">
                {hasSearched && results.length === 0 && !isSearching && query !== "" && (
                  <p className="text-center text-sm italic text-slate-500">Không tìm thấy bệnh nhân nào khớp với tên này.</p>
                )}

                {results.map((patient) => {
                  const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : "N/A";
                  const isLinked = patient.is_linked; 

                  return (
                    <article key={patient.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 dark:border-white/5 dark:bg-slate-900/50">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          <UserRound className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-slate-900 dark:text-white">{patient.full_name}</h3>
                          <p className="text-xs font-medium text-slate-500">{age} tuổi • {patient.gender || "Không rõ GT"}</p>
                          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <Phone className="size-3.5" /> Người nhà: {patient.caregiver_name} ({patient.caregiver_phone})
                          </p>
                        </div>
                      </div>

                      {isLinked ? (
                        <button 
                          disabled
                          className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400"
                        >
                          Đã liên kết
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleLink(patient.id)}
                          disabled={linkingId === patient.id}
                          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
                        >
                          {linkingId === patient.id ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                          Liên kết
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
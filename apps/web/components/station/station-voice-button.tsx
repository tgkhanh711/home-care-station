"use client";

import { useState } from "react";

type StationVoiceButtonProps = {
  text: string;
};

export function StationVoiceButton({ text }: StationVoiceButtonProps) {
  const [status, setStatus] = useState("Sẵn sàng đọc thông báo.");

  function handleSpeak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("Trình duyệt này chưa hỗ trợ đọc tiếng nói.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setStatus("Đang đọc thông báo...");
    };

    utterance.onend = () => {
      setStatus("Đã đọc xong thông báo.");
    };

    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleSpeak}
        className="w-full rounded-4xl border-4 border-black bg-yellow-300 px-8 py-7 text-4xl font-black text-black shadow-[0_8px_0_#000] active:translate-y-1 active:shadow-[0_4px_0_#000]"
      >
        🔊 ĐỌC TO
      </button>
      <p className="text-center text-2xl font-black text-black">{status}</p>
    </div>
  );
}
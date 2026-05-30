import { Bot, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AiCommandBoxProps = {
  placeholder?: string;
};

export function AiCommandBox({
  placeholder = "Hỏi AI Assistant về lịch thuốc, cảnh báo, chỉ số sức khỏe hoặc tin nhắn nghi lừa đảo..."
}: AiCommandBoxProps) {
  return (
    <div className="rounded-3xl border border-primary/20 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Bot className="size-5 text-primary" />
        AI Assistant trung tâm
      </div>

      <div className="flex gap-3">
        <Textarea
          placeholder={placeholder}
          className="min-h-20 resize-none rounded-2xl"
          disabled
        />
        <Button type="button" size="icon" className="size-11 shrink-0 rounded-2xl" disabled>
          <SendHorizontal className="size-5" />
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        UI đã chuẩn bị ở Cụm 2. Backend API và n8n sẽ nối ở cụm AI.
      </p>
    </div>
  );
}
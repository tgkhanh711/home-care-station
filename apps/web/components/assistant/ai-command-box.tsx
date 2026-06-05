import { Bot, ArrowDownRight } from "lucide-react";

export function AiCommandBox() {
  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-full">
          <Bot className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">AI Assistant đã được nâng cấp</h4>
          <p className="text-xs text-muted-foreground">
            Trợ lý trung tâm hiện đã được chuyển xuống góc phải màn hình.
          </p>
        </div>
      </div>
      <ArrowDownRight className="size-6 text-primary animate-bounce hidden sm:block" />
    </div>
  );
}
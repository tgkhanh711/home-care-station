"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePrescription } from "@/app/actions/prescriptions";

export function DeletePrescriptionButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter(); // Khởi tạo router

  const handleDelete = async () => {
    if (!window.confirm("Hành động này sẽ xóa hoàn toàn đơn thuốc. Bạn có chắc chắn?")) return;
    
    setIsDeleting(true);
    const res = await deletePrescription(id);
    setIsDeleting(false);

    if (res.error) {
      alert(res.error); // Hiện lỗi nếu DB từ chối
    } else {
      router.refresh(); // Ép Next.js tải lại dữ liệu UI lập tức khi xóa thành công
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
    >
      {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Xóa đơn
    </button>
  );
}
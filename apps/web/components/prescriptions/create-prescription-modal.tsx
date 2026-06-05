"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Pill } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPrescription } from "@/app/actions/prescriptions";
import type { Database } from "@/database";

type Medicine = Database["public"]["Tables"]["medicines"]["Row"];

const prescriptionSchema = z.object({
  diagnosis: z.string().min(1, "Vui lòng nhập chẩn đoán bệnh."),
  notes: z.string().optional(),
  start_date: z.string().min(1, "Bắt buộc chọn ngày bắt đầu."),
  end_date: z.string().optional(),
  items: z.array(
    z.object({
      medicine_name: z.string().min(1, "Bắt buộc nhập tên thuốc."),
      dosage: z.string().min(1, "Bắt buộc nhập liều dùng."),
      frequency: z.string().min(1, "Bắt buộc nhập tần suất."),
      time_slots: z.array(z.string()).min(1, "Bắt buộc có ít nhất 1 giờ uống."),
      instructions: z.string().optional(),
    })
  ).min(1, "Phải kê ít nhất 1 loại thuốc."),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

interface Props {
  elderlyProfileId: string;
  medicines: Medicine[];
}

export function CreatePrescriptionModal({ elderlyProfileId, medicines }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Lấy ngày hôm nay làm mặc định cho start_date
  const today = new Date().toISOString().split('T')[0];

  const { register, control, handleSubmit, reset, getValues, setValue, formState: { errors, isSubmitting } } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      diagnosis: "", notes: "", start_date: today, end_date: "",
      items: [{ medicine_name: "", dosage: "", frequency: "", time_slots: ["08:00"], instructions: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ name: "items", control });

  const onSubmit = async (data: PrescriptionFormValues) => {
    if (!elderlyProfileId) return alert("Không tìm thấy bệnh nhân.");
    const res = await createPrescription({
      elderly_profile_id: elderlyProfileId,
      ...data,
    });

    if (res.error) alert(res.error);
    else { setIsOpen(false); reset(); router.refresh(); }
  };

  const removeTimeSlot = (itemIndex: number, timeIndex: number) => {
    const current = getValues(`items.${itemIndex}.time_slots`) as string[] || [];
    setValue(`items.${itemIndex}.time_slots`, current.filter((_, i) => i !== timeIndex));
  };

  return (
    <>
      {/* 1. Datalist: Cung cấp gợi ý dropdown nhưng vẫn cho phép nhập chữ */}
      <datalist id="medicines-list">
        {medicines?.map(med => <option key={med.id} value={`${med.name} ${med.strength || ''}`.trim()} />)}
      </datalist>
      <datalist id="dosage-list">
        <option value="1 viên" /><option value="2 viên" /><option value="1/2 viên" /><option value="5ml" /><option value="1 gói" />
      </datalist>
      <datalist id="frequency-list">
        <option value="1 lần/ngày" /><option value="2 lần/ngày" /><option value="3 lần/ngày" /><option value="Khi đau/sốt" />
      </datalist>

      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700">
        <Plus className="size-4" /> Kê đơn mới
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all">
          <div className="custom-scrollbar w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Tạo Y Lệnh Mới</h2>
              <button onClick={() => { setIsOpen(false); reset(); }} className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10"><X className="size-5" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              
              {/* Lịch Ngày bắt đầu & Kết thúc */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 rounded-2xl bg-blue-50/50 p-4 dark:bg-blue-900/10">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input type="date" {...register("start_date")} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-950" />
                  {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Ngày kết thúc (Tùy chọn)</label>
                  <input type="date" {...register("end_date")} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-950" />
                </div>
              </div>

              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">Chẩn đoán bệnh <span className="text-red-500">*</span></label>
                  <input {...register("diagnosis")} placeholder="VD: Viêm phế quản cấp..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-950" />
                  {errors.diagnosis && <p className="mt-1 text-xs text-red-500">{errors.diagnosis.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">Lời dặn bác sĩ</label>
                  <input {...register("notes")} placeholder="VD: Uống nhiều nước, kiêng đồ lạnh..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-950" />
                </div>
              </div>

              <h3 className="mb-4 text-lg font-black text-slate-900 dark:text-white">Chi tiết Đơn thuốc</h3>

              <div className="space-y-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="relative rounded-[20px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/20"><X className="size-4" /></button>
                    )}
                    
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      
                      {/* Tên thuốc: Dùng Input + Datalist */}
                      <div className="sm:col-span-2 lg:col-span-4 pr-10">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Tên thuốc <span className="text-red-500">*</span></label>
                        <input list="medicines-list" {...register(`items.${index}.medicine_name`)} placeholder="Nhập hoặc chọn tên thuốc..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-900" />
                        {errors.items?.[index]?.medicine_name && <p className="mt-1 text-xs text-red-500">{errors.items[index]?.medicine_name?.message}</p>}
                      </div>

                      {/* Liều dùng */}
                      <div className="lg:col-span-1">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Liều dùng <span className="text-red-500">*</span></label>
                        <input list="dosage-list" {...register(`items.${index}.dosage`)} placeholder="VD: 1 viên" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-900" />
                        {errors.items?.[index]?.dosage && <p className="mt-1 text-xs text-red-500">{errors.items[index]?.dosage?.message}</p>}
                      </div>

                      {/* Tần suất */}
                      <div className="lg:col-span-1">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Tần suất <span className="text-red-500">*</span></label>
                        <input list="frequency-list" {...register(`items.${index}.frequency`)} placeholder="VD: 2 lần/ngày" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-900" />
                        {errors.items?.[index]?.frequency && <p className="mt-1 text-xs text-red-500">{errors.items[index]?.frequency?.message}</p>}
                      </div>

                      <div className="sm:col-span-2 lg:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Giờ uống <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {item.time_slots?.map((_, tIndex) => (
                            <div key={tIndex} className="relative flex items-center">
                              <input 
                                type="time" 
                                {...register(`items.${index}.time_slots.${tIndex}` as const)} 
                                className="h-[38px] rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-800" 
                              />
                              {item.time_slots?.length > 1 && (
                                <button type="button" onClick={() => removeTimeSlot(index, tIndex)} className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-red-100 text-xs text-red-600 shadow-sm hover:bg-red-200">
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {errors.items?.[index]?.time_slots && <p className="mt-1 text-xs text-red-500">{errors.items[index]?.time_slots?.root?.message || "Lỗi khung giờ"}</p>}
                      </div>

                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Ghi chú thêm</label>
                        <input {...register(`items.${index}.instructions`)} placeholder="VD: Uống sau ăn no 30 phút" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-slate-900" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => append({ medicine_name: "", dosage: "", frequency: "", time_slots: ["08:00"], instructions: "" })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-bold text-slate-500 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/20 dark:hover:bg-blue-500/10">
                <Pill className="size-4" /> Kê thêm thuốc khác
              </button>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
                <button type="button" onClick={() => { setIsOpen(false); reset(); }} className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-lg hover:bg-blue-700 disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Lưu Phác Đồ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
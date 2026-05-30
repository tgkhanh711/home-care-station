import { z } from "zod";

const phoneLikeSchema = z
  .string()
  .trim()
  .min(8, "Số điện thoại không hợp lệ.")
  .max(20, "Số điện thoại quá dài.")
  .regex(/^[0-9+\s().-]+$/, "Số điện thoại chỉ nên chứa số và ký tự + . - ().");

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine(
    (value) => value === "" || z.string().uuid().safeParse(value).success,
    "ID bác sĩ không hợp lệ."
  );

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Vui lòng nhập mật khẩu.")
});

export const registerCaregiverSchema = z
  .object({
    caregiverName: z.string().trim().min(2, "Tên người nhà quá ngắn."),
    caregiverPhone: phoneLikeSchema,
    caregiverEmail: z
      .string()
      .trim()
      .email("Email caregiver không hợp lệ.")
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8, "Mật khẩu cần tối thiểu 8 ký tự."),
    confirmPassword: z.string().min(8, "Vui lòng nhập lại mật khẩu."),

    elderlyFullName: z.string().trim().min(2, "Tên người cao tuổi quá ngắn."),
    elderlyDob: z.string().trim().min(4, "Ngày sinh không hợp lệ."),
    elderlyGender: z.enum(["male", "female", "other", "unknown"], {
      message: "Giới tính người cao tuổi không hợp lệ."
    }),
    relationship: z.enum(
      ["child", "spouse", "sibling", "grandchild", "relative", "caregiver", "other"],
      {
        message: "Quan hệ với người cao tuổi không hợp lệ."
      }
    ),
    medicalConditions: z.string().trim().optional().default(""),
    allergies: z
      .string()
      .trim()
      .min(2, "Vui lòng nhập dị ứng thuốc. Nếu không có, nhập: Không có."),
    primaryDoctorId: optionalUuidSchema,

    emergencyContact: z.string().trim().min(5, "Liên hệ khẩn cấp không hợp lệ."),

    stationName: z.string().trim().min(2, "Tên Station quá ngắn."),
    stationPairingCode: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
      .refine(
        (value) => value === "" || /^[A-Z0-9-]{4,24}$/.test(value),
        "Mã ghép nối Station chỉ gồm chữ hoa, số, dấu gạch ngang và dài 4-24 ký tự."
      )
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"]
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCaregiverInput = z.infer<typeof registerCaregiverSchema>;
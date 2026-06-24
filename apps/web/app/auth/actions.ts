"use server";

import { randomBytes, randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { ROLE_HOME_ROUTE } from "@/lib/constants";
import type {
  LoginActionState,
  RegisterActionState
} from "@/lib/auth/action-state";
import {
  loginSchema,
  registerCaregiverSchema
} from "@/lib/auth/validation";
import { getAppUserById } from "@/lib/auth/app-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIN_ELDERLY_DOB = "1900-01-01";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isAllowedElderlyDob(value: string) {
  if (!isValidDateOnly(value)) {
    return false;
  }

  const maxDob = getTodayDateInputValue();

  return value >= MIN_ELDERLY_DOB && value <= maxDob;
}

function isValidPhoneLike(value: string) {
  return /^[0-9+\s().-]{8,20}$/.test(value);
}

function makeEmergencyContact(name: string, phone: string) {
  return `${name.trim()} - ${phone.trim()}`;
}

function makeStationPassword() {
  return `Station-${randomBytes(4).toString("hex")}!`;
}

function makeStationEmail(caregiverEmail: string) {
  const safePrefix =
    caregiverEmail
      .split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "caregiver";

  return `station.${safePrefix}.${Date.now()}@homecare.local`;
}

function makeDeviceCode() {
  return `HCS-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function makeTextArray(value: string, fallback: string) {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return [fallback];
  }

  return cleanedValue
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRawErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi không xác định.";
}

function isDuplicateEmailError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("users_email_lower_unique") ||
    normalizedMessage.includes("duplicate key value violates unique constraint") ||
    normalizedMessage.includes("already been registered") ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("user already exists")
  );
}

function registerErrorMessage(error: unknown) {
  const message = getRawErrorMessage(error);

  if (isDuplicateEmailError(message)) {
    return "Email này đã tồn tại trong hệ thống. Vui lòng dùng email khác.";
  }

  if (message.toLowerCase().includes("devices_device_code_unique")) {
    return "Mã ghép nối Station đã tồn tại. Vui lòng nhập mã khác hoặc để trống để hệ thống tự tạo.";
  }

  return message;
}

async function assertDoctorIsValid(
  supabaseAdmin: SupabaseAdminClient,
  doctorId: string
) {
  if (!doctorId) {
    return {
      ok: true as const,
      message: ""
    };
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", doctorId)
    .eq("role", "doctor")
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      message: error.message
    };
  }

  if (!data) {
    return {
      ok: false as const,
      message: "Bác sĩ được chọn không tồn tại hoặc không có role doctor."
    };
  }

  return {
    ok: true as const,
    message: ""
  };
}

async function getUniqueDeviceCode(
  supabaseAdmin: SupabaseAdminClient,
  preferredCode: string
) {
  if (preferredCode) {
    const { data, error } = await supabaseAdmin
      .from("devices")
      .select("id")
      .ilike("device_code", preferredCode)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      throw new Error("devices_device_code_unique");
    }

    return preferredCode;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generatedCode = makeDeviceCode();

    const { data, error } = await supabaseAdmin
      .from("devices")
      .select("id")
      .ilike("device_code", generatedCode)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return generatedCode;
    }
  }

  throw new Error("Không tạo được mã thiết bị Station duy nhất.");
}

async function trySignInCaregiver(email: string, password: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return !error;
  } catch {
    return false;
  }
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formValue(formData, "email").toLowerCase(),
    password: formValue(formData, "password")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Dữ liệu đăng nhập không hợp lệ."
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: "Email hoặc mật khẩu không đúng."
    };
  }

  const appUser = await getAppUserById(data.user.id);

  if (!appUser) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message:
        "Tài khoản Auth tồn tại nhưng chưa có bản ghi role trong bảng public.users."
    };
  }

  redirect(ROLE_HOME_ROUTE[appUser.role]);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function registerCaregiverAction(
  _previousState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const caregiverName = formValue(formData, "caregiverName");
  const caregiverPhone = formValue(formData, "caregiverPhone");
  const caregiverEmail = formValue(formData, "caregiverEmail").toLowerCase();

  const password = formValue(formData, "password");
  const confirmPassword = formValue(formData, "confirmPassword");

  const elderlyFullName = formValue(formData, "elderlyFullName");
  const elderlyDob = formValue(formData, "elderlyDob");
  const elderlyGender = formValue(formData, "elderlyGender") || "unknown";
  const relationship = formValue(formData, "relationship") || "relative";
  const medicalConditions = formValue(formData, "medicalConditions");
  const allergies = formValue(formData, "allergies");
  const primaryDoctorId = formValue(formData, "primaryDoctorId");

  const emergencyContactName = formValue(formData, "emergencyContactName");
  const emergencyContactPhone = formValue(formData, "emergencyContactPhone");
  const emergencyContact = makeEmergencyContact(
    emergencyContactName,
    emergencyContactPhone
  );

  const stationName = formValue(formData, "stationName");
  const stationPairingCode = formValue(formData, "stationPairingCode");

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Mật khẩu nhập lại chưa trùng khớp."
    };
  }

  if (!isAllowedElderlyDob(elderlyDob)) {
    return {
      status: "error",
      message:
        "Ngày sinh người cao tuổi không hợp lệ. Vui lòng chọn ngày từ 01/01/1900 đến hiện tại."
    };
  }

  if (!emergencyContactName || !emergencyContactPhone) {
    return {
      status: "error",
      message: "Vui lòng nhập đủ tên và số điện thoại liên hệ khẩn cấp."
    };
  }

  if (!isValidPhoneLike(emergencyContactPhone)) {
    return {
      status: "error",
      message:
        "Số điện thoại liên hệ khẩn cấp không hợp lệ. Vui lòng nhập từ 8 đến 20 ký tự số."
    };
  }

  const parsed = registerCaregiverSchema.safeParse({
    caregiverName,
    caregiverPhone,
    caregiverEmail,
    password,
    confirmPassword,
    elderlyFullName,
    elderlyDob,
    elderlyGender,
    relationship,
    medicalConditions,
    allergies,
    primaryDoctorId,
    emergencyContact,
    stationName,
    stationPairingCode
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Dữ liệu đăng ký không hợp lệ."
    };
  }

  const input = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();

  const doctorCheck = await assertDoctorIsValid(
    supabaseAdmin,
    input.primaryDoctorId
  );

  if (!doctorCheck.ok) {
    return {
      status: "error",
      message: doctorCheck.message
    };
  }

  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", input.caregiverEmail)
    .limit(1)
    .maybeSingle();

  if (existingUserError) {
    return {
      status: "error",
      message: existingUserError.message
    };
  }

  if (existingUser) {
    return {
      status: "error",
      message: "Email này đã tồn tại trong hệ thống. Vui lòng dùng email khác."
    };
  }

  let caregiverAuthUserId: string | null = null;
  let stationAuthUserId: string | null = null;
  let elderlyProfileId: string | null = null;
  let deviceId: string | null = null;
  let caregiverElderlyLinkCreated = false;

  const stationEmail = makeStationEmail(input.caregiverEmail);
  const stationPassword = makeStationPassword();

  try {
    const deviceCode = await getUniqueDeviceCode(
      supabaseAdmin,
      input.stationPairingCode
    );

    const { data: caregiverAuth, error: caregiverAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.caregiverEmail,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.caregiverName,
          phone: input.caregiverPhone,
          role: "caregiver"
        }
      });

    if (caregiverAuthError || !caregiverAuth.user) {
      throw new Error(
        caregiverAuthError?.message ?? "Không tạo được tài khoản caregiver."
      );
    }

    caregiverAuthUserId = caregiverAuth.user.id;

    const { data: stationAuth, error: stationAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email: stationEmail,
        password: stationPassword,
        email_confirm: true,
        user_metadata: {
          full_name: input.stationName,
          role: "station"
        }
      });

    if (stationAuthError || !stationAuth.user) {
      throw new Error(
        stationAuthError?.message ?? "Không tạo được tài khoản station."
      );
    }

    stationAuthUserId = stationAuth.user.id;

    const { error: usersInsertError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: caregiverAuthUserId,
          email: input.caregiverEmail,
          full_name: input.caregiverName,
          phone: input.caregiverPhone,
          role: "caregiver"
        },
        {
          id: stationAuthUserId,
          email: stationEmail,
          full_name: input.stationName,
          role: "station"
        }
      ]);

    if (usersInsertError) {
      throw new Error(usersInsertError.message);
    }

    elderlyProfileId = randomUUID();

    const { data: elderlyProfile, error: elderlyProfileError } =
      await supabaseAdmin
        .from("elderly_profiles")
        .insert({
          id: elderlyProfileId,
          caregiver_id: caregiverAuthUserId,
          doctor_id: input.primaryDoctorId || null,
          full_name: input.elderlyFullName,
          dob: input.elderlyDob,
          gender: input.elderlyGender,
          medical_conditions: makeTextArray(
            input.medicalConditions,
            "Không có ghi chú y tế"
          ),
          allergies: makeTextArray(input.allergies, "Không có"),
          emergency_contact: input.emergencyContact,
          care_status: "stable"
        })
        .select("id")
        .single();

    if (elderlyProfileError || !elderlyProfile) {
      throw new Error(
        elderlyProfileError?.message ?? "Không tạo được hồ sơ người cao tuổi."
      );
    }

    const { error: caregiverLinkError } = await supabaseAdmin
      .from("caregiver_elderly_links")
      .insert({
        caregiver_id: caregiverAuthUserId,
        elderly_profile_id: elderlyProfile.id,
        relationship: input.relationship,
        is_primary: true
      });

    if (caregiverLinkError) {
      throw new Error(caregiverLinkError.message);
    }

    caregiverElderlyLinkCreated = true;

    deviceId = randomUUID();

    const { error: deviceInsertError } = await supabaseAdmin
      .from("devices")
      .insert({
        id: deviceId,
        elderly_profile_id: elderlyProfile.id,
        station_user_id: stationAuthUserId,
        name: input.stationName,
        device_code: deviceCode,
        status: "pending_activation"
      });

    if (deviceInsertError) {
      throw new Error(deviceInsertError.message);
    }

    const caregiverAutoSignedIn = await trySignInCaregiver(
      input.caregiverEmail,
      input.password
    );

    return {
      status: "success",
      message: "Đăng ký thành công. Hãy lưu thông tin tài khoản Station.",
      caregiverEmail: input.caregiverEmail,
      stationEmail,
      stationPassword,
      deviceCode,
      caregiverAutoSignedIn
    };
  } catch (error) {
    if (deviceId) {
      await supabaseAdmin.from("devices").delete().eq("id", deviceId);
    }

    if (caregiverElderlyLinkCreated && caregiverAuthUserId && elderlyProfileId) {
      await supabaseAdmin
        .from("caregiver_elderly_links")
        .delete()
        .eq("caregiver_id", caregiverAuthUserId)
        .eq("elderly_profile_id", elderlyProfileId);
    }

    if (elderlyProfileId) {
      await supabaseAdmin
        .from("elderly_profiles")
        .delete()
        .eq("id", elderlyProfileId);
    }

    if (stationAuthUserId) {
      await supabaseAdmin.from("users").delete().eq("id", stationAuthUserId);
      await supabaseAdmin.auth.admin.deleteUser(stationAuthUserId);
    }

    if (caregiverAuthUserId) {
      await supabaseAdmin.from("users").delete().eq("id", caregiverAuthUserId);
      await supabaseAdmin.auth.admin.deleteUser(caregiverAuthUserId);
    }

    return {
      status: "error",
      message: registerErrorMessage(error)
    };
  }
}
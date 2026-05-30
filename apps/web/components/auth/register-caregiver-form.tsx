"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2
} from "lucide-react";

import { registerCaregiverAction } from "@/app/auth/actions";
import { initialRegisterActionState } from "@/lib/auth/action-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MIN_ELDERLY_DOB = "1900-01-01";

export type DoctorOption = {
  id: string;
  fullName: string;
  email: string;
};

type RegisterCaregiverFormProps = {
  doctorOptions?: DoctorOption[];
};

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const MAX_ELDERLY_DOB = getTodayDateInputValue();

function isValidDateInputValue(value: string) {
  if (!value) {
    return true;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  return value >= MIN_ELDERLY_DOB && value <= MAX_ELDERLY_DOB;
}

function RegisterSubmitButton({ blocked }: { blocked: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-2xl"
      disabled={pending || blocked}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Đang tạo tài khoản...
        </>
      ) : (
        "Tạo tài khoản"
      )}
    </Button>
  );
}

export function RegisterCaregiverForm({
  doctorOptions = []
}: RegisterCaregiverFormProps) {
  const [state, formAction] = useActionState(
    registerCaregiverAction,
    initialRegisterActionState
  );

  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [elderlyFullName, setElderlyFullName] = useState("");
  const [elderlyDob, setElderlyDob] = useState("");

  const [stationName, setStationName] = useState("");
  const [stationNameEdited, setStationNameEdited] = useState(false);

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const hasPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const hasDobError =
    elderlyDob.length > 0 && !isValidDateInputValue(elderlyDob);

  const emergencyContactValue = useMemo(() => {
    const name = emergencyContactName.trim();
    const phone = emergencyContactPhone.trim();

    if (name && phone) {
      return `${name} - ${phone}`;
    }

    return name || phone;
  }, [emergencyContactName, emergencyContactPhone]);

  const isSubmitBlocked = hasPasswordMismatch || hasDobError;

  function fillEmergencyContactFromCaregiver() {
    if (caregiverName.trim()) {
      setEmergencyContactName(caregiverName.trim());
    }

    if (caregiverPhone.trim()) {
      setEmergencyContactPhone(caregiverPhone.trim());
    }
  }

  function handleElderlyFullNameChange(value: string) {
    setElderlyFullName(value);

    if (!stationNameEdited) {
      const nextStationName = value.trim() ? `Station - ${value.trim()}` : "";
      setStationName(nextStationName);
    }
  }

  return (
    <div className="space-y-5">
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Đăng ký thất bại</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === "success" ? (
        <Alert className="border-success/30 bg-success/10 text-success">
          <CheckCircle2 className="size-4" />
          <AlertTitle>{state.message}</AlertTitle>
          <AlertDescription className="mt-3 space-y-3 text-foreground">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm font-semibold">Tài khoản caregiver</p>
              <p className="mt-1 font-mono text-sm">{state.caregiverEmail}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {state.caregiverAutoSignedIn
                  ? "Caregiver đã được đăng nhập tự động trên trình duyệt này."
                  : "Nếu chưa vào được dashboard, hãy đăng nhập lại bằng email caregiver."}
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="size-4" />
                Tài khoản Station cần lưu lại
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Email Station:
              </p>
              <p className="font-mono text-sm">{state.stationEmail}</p>

              <p className="mt-2 text-sm text-muted-foreground">
                Mật khẩu Station:
              </p>
              <p className="font-mono text-sm">{state.stationPassword}</p>

              <p className="mt-2 text-sm text-muted-foreground">
                Mã ghép nối thiết bị:
              </p>
              <p className="font-mono text-sm">{state.deviceCode}</p>
            </div>

          </AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="emergencyContact"
          value={emergencyContactValue}
        />

        <Card>
          <CardHeader className="pb-5">
            <CardTitle className="text-xl font-semibold tracking-tight">
              1. Thông tin người nhà
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="caregiverName">Họ tên người nhà</Label>
              <Input
                id="caregiverName"
                name="caregiverName"
                value={caregiverName}
                onChange={(event) => setCaregiverName(event.target.value)}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caregiverPhone">Số điện thoại</Label>
              <Input
                id="caregiverPhone"
                name="caregiverPhone"
                type="tel"
                value={caregiverPhone}
                onChange={(event) => setCaregiverPhone(event.target.value)}
                placeholder="0912345678"
                autoComplete="tel"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="caregiverEmail">Email đăng nhập caregiver</Label>
              <Input
                id="caregiverEmail"
                name="caregiverEmail"
                type="email"
                placeholder="caregiver@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  className="pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  aria-invalid={hasPasswordMismatch}
                  className="pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={
                    showConfirmPassword
                      ? "Ẩn mật khẩu nhập lại"
                      : "Hiện mật khẩu nhập lại"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {hasPasswordMismatch ? (
                <p className="text-sm font-medium text-destructive">
                  Mật khẩu nhập lại chưa trùng khớp.
                </p>
              ) : confirmPassword.length > 0 ? (
                <p className="text-sm font-medium text-emerald-500">
                  Mật khẩu đã trùng khớp.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-5">
            <CardTitle className="text-xl font-semibold tracking-tight">
              2. Thông tin người cao tuổi
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="elderlyFullName">Họ tên người cao tuổi</Label>
              <Input
                id="elderlyFullName"
                name="elderlyFullName"
                value={elderlyFullName}
                onChange={(event) =>
                  handleElderlyFullNameChange(event.target.value)
                }
                placeholder="Nguyễn Thị B"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="elderlyDob">Ngày sinh</Label>
              <Input
                id="elderlyDob"
                name="elderlyDob"
                type="date"
                value={elderlyDob}
                onChange={(event) => setElderlyDob(event.target.value)}
                min={MIN_ELDERLY_DOB}
                max={MAX_ELDERLY_DOB}
                aria-invalid={hasDobError}
                required
              />

              {hasDobError ? (
                <p className="text-sm font-medium text-destructive">
                  Ngày sinh phải nằm trong khoảng chính xác.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Chọn ngày bằng lịch hoặc nhập theo định dạng ngày/tháng/năm.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="elderlyGender">Giới tính của người cao tuổi</Label>
              <select
                id="elderlyGender"
                name="elderlyGender"
                defaultValue="unknown"
                className="h-12 w-full rounded-2xl border border-border bg-white/70 px-4 text-base shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-slate-950/60"
                required
              >
                <option value="unknown">Chưa xác định</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Quan hệ với người cao tuổi</Label>
              <select
                id="relationship"
                name="relationship"
                defaultValue="child"
                className="h-12 w-full rounded-2xl border border-border bg-white/70 px-4 text-base shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-slate-950/60"
                required
              >
                <option value="child">Con</option>
                <option value="spouse">Vợ/chồng</option>
                <option value="sibling">Anh/chị/em</option>
                <option value="grandchild">Cháu</option>
                <option value="relative">Người thân</option>
                <option value="caregiver">Người chăm sóc</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="primaryDoctorId">Bác sĩ phụ trách</Label>
              <select
                id="primaryDoctorId"
                name="primaryDoctorId"
                defaultValue=""
                className="h-12 w-full rounded-2xl border border-border bg-white/70 px-4 text-base shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-slate-950/60"
              >
                <option value="">
                  {doctorOptions.length > 0
                    ? "Chưa chọn bác sĩ"
                    : "Chưa có bác sĩ trong hệ thống"}
                </option>

                {doctorOptions.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName} - {doctor.email}
                  </option>
                ))}
              </select>

              <p className="text-xs text-muted-foreground">
                Có thể để trống ở giai đoạn đầu. Admin/doctor có thể gán lại ở
                cụm sau.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="medicalConditions">Bệnh nền / ghi chú y tế</Label>
              <Textarea
                id="medicalConditions"
                name="medicalConditions"
                placeholder="Ví dụ: tăng huyết áp, tiểu đường type 2..."
                className="min-h-28"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allergies">Dị ứng thuốc / thực phẩm</Label>
              <Textarea
                id="allergies"
                name="allergies"
                placeholder="Nếu không có, nhập: Không có"
                className="min-h-24"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-5">
            <CardTitle className="text-xl font-semibold tracking-tight">
              3. Thông tin liên hệ khẩn cấp
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">
                  Tên người liên hệ
                </Label>
                <Input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(event.target.value)
                  }
                  placeholder={caregiverName || "Nguyễn Văn A"}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">
                  Số điện thoại khẩn cấp
                </Label>
                <Input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(event.target.value)
                  }
                  placeholder={caregiverPhone || "0912345678"}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={fillEmergencyContactFromCaregiver}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-muted"
            >
              <Copy className="size-4" />
              Dùng thông tin người nhà
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-5">
            <CardTitle className="text-xl font-semibold tracking-tight">
              4. Thiết lập Station
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stationName">Tên thiết bị Station</Label>
              <Input
                id="stationName"
                name="stationName"
                value={stationName}
                onChange={(event) => {
                  setStationNameEdited(true);
                  setStationName(event.target.value);
                }}
                placeholder="Station - Nguyễn Thị B"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stationPairingCode">Mã ghép nối Station</Label>
              <Input
                id="stationPairingCode"
                name="stationPairingCode"
                placeholder="Để trống để tự tạo"
                autoComplete="off"
              />

              <p className="text-xs text-muted-foreground">
                Nếu để trống, hệ thống tự tạo mã dạng HCS-XXXXXX.
              </p>
            </div>
          </CardContent>
        </Card>

        <RegisterSubmitButton blocked={isSubmitBlocked} />
      </form>
    </div>
  );
}
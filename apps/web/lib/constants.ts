export const APP_NAME = "Home Care Station" as const;

export const APP_ROLES = ["admin", "doctor", "caregiver", "station"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROUTES = {
  root: "/",
  login: "/login",
  register: "/register",
  admin: "/admin",
  doctor: "/doctor",
  caregiver: "/caregiver",
  station: "/station",
  assistant: "/assistant"
} as const;

export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
  admin: ROUTES.admin,
  doctor: ROUTES.doctor,
  caregiver: ROUTES.caregiver,
  station: ROUTES.station
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Quản trị viên",
  doctor: "Bác sĩ",
  caregiver: "Người nhà",
  station: "Station"
};

export const ALERT_SEVERITY = ["info", "warning", "critical", "emergency"] as const;

export type AlertSeverity = (typeof ALERT_SEVERITY)[number];

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Thông tin",
  warning: "Cảnh báo",
  critical: "Nghiêm trọng",
  emergency: "Cấp cứu"
};
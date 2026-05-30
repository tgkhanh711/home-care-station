export type LoginActionState = {
  status: "idle" | "error";
  message: string;
};

export type RegisterActionState = {
  status: "idle" | "error" | "success";
  message: string;
  caregiverEmail?: string;
  caregiverAutoSignedIn?: boolean;
  stationEmail?: string;
  stationPassword?: string;
  deviceCode?: string;
};

export const initialLoginActionState: LoginActionState = {
  status: "idle",
  message: ""
};

export const initialRegisterActionState: RegisterActionState = {
  status: "idle",
  message: ""
};
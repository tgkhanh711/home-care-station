"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction } from "@/app/auth/actions";
import { initialLoginActionState } from "@/lib/auth/action-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Đang đăng nhập...
        </>
      ) : (
        "Đăng nhập"
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(
    loginAction,
    initialLoginActionState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Không thể đăng nhập</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="caregiver@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <LoginSubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản caregiver?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Đăng ký tại đây
        </Link>
      </p>
    </form>
  );
}
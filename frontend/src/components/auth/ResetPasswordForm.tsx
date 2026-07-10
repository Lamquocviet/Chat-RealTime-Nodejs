import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có chữ thường")
      .regex(/\d/, "Mật khẩu phải có số"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
      });
    }
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };

    if (typeof maybeError.response?.data?.message === "string") {
      return maybeError.response.data.message;
    }

    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }

  return "Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại.";
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError("password", {
        type: "server",
        message: "Liên kết đặt lại mật khẩu không hợp lệ.",
      });
      return;
    }

    try {
      await authService.resetPassword(token, data.password, data.confirmPassword);
      setIsSuccess(true);
      toast.success("Đổi mật khẩu thành công.");
    } catch (error) {
      setError("password", {
        type: "server",
        message: getErrorMessage(error),
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="logo" />
                </a>

                <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
                <p className="text-muted-foreground text-balance">
                  Tạo mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              {isSuccess ? (
                <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Đổi mật khẩu thành công</h2>
                    <p className="text-sm text-muted-foreground">
                      Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
                    </p>
                  </div>
                  <Button type="button" className="w-full" onClick={() => navigate("/signin")}>
                    Đăng nhập
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="password" className="block text-sm">
                      Mật khẩu mới
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label htmlFor="confirmPassword" className="block text-sm">
                      Xác nhận mật khẩu
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        {...register("confirmPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

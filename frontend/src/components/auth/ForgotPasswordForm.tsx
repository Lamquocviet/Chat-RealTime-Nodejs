import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

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

  return "Không thể gửi liên kết lúc này. Vui lòng thử lại.";
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await authService.forgotPassword(data.email);
      setIsSent(true);
      toast.success("Nếu email tồn tại, hướng dẫn đã được gửi.");
    } catch (error) {
      setError("email", {
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

                <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
                <p className="text-muted-foreground text-balance">
                  Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                </p>
              </div>

              {isSent ? (
                <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <MailCheck className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Email đã được gửi</h2>
                    <p className="text-sm text-muted-foreground">
                      Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.
                    </p>
                  </div>
                  <Button type="button" className="w-full" onClick={() => navigate("/signin")}>
                    Quay lại đăng nhập
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="email" className="block text-sm">
                      Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      placeholder="name@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
                  </Button>

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => navigate("/signin")}
                      className="underline underline-offset-4"
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
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

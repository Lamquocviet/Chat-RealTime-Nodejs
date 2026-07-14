import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      toast.error("Đăng nhập Google không thành công.");
      navigate("/signin", { replace: true });
      return;
    }

    const finishLogin = async () => {
      const success = await completeGoogleLogin(token);

      if (success) {
        navigate("/", { replace: true });
      } else {
        navigate("/signin", { replace: true });
      }
    };

    void finishLogin();
  }, [completeGoogleLogin, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">Đang xử lý đăng nhập...</p>
    </div>
  );
}

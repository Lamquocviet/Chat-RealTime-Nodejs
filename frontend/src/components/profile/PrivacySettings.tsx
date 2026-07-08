import { useState } from "react";
import { Shield, Bell, ShieldBan, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/useAuthStore";

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [form, setForm] = useState<PasswordFormState>(initialForm);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<PasswordFormState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof PasswordFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // clear lỗi khi user gõ lại
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const validate = (): boolean => {
    const newErrors: Partial<PasswordFormState> = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!form.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự";
    } else if (form.newPassword === form.currentPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (form.confirmPassword !== form.newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetAndClose = () => {
    setForm(initialForm);
    setErrors({});
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await authService.changePassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword,
      );

      toast.success(response.message || "Đổi mật khẩu thành công");
      resetAndClose();
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message ||
        "Lỗi khi đổi mật khẩu. Vui lòng thử lại.";

      if (
        errorMessage.toLowerCase().includes("current password") ||
        errorMessage.toLowerCase().includes("incorrect")
      ) {
        setErrors({
          currentPassword: "Mật khẩu hiện tại không đúng",
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) =>
        !isSubmitting && (o ? onOpenChange(o) : resetAndClose())
      }
    >
      <DialogContent className="glass-strong border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription>
            Nhập mật khẩu hiện tại và mật khẩu mới của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mật khẩu hiện tại */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={handleChange("currentPassword")}
                className="glass-light border-border/30 pr-10"
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                className="glass-light border-border/30 pr-10"
                placeholder="Ít nhất 8 ký tự"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="glass-light border-border/30 pr-10"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={resetAndClose}
            disabled={isSubmitting}
            className="glass-light border-border/30"
          >
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PrivacySettings = () => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Quyền riêng tư & Bảo mật
        </CardTitle>
        <CardDescription>
          Quản lý cài đặt quyền riêng tư và bảo mật của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30 hover:text-warning"
            onClick={() => setIsPasswordDialogOpen(true)}
          >
            <Shield className="h-4 w-4 mr-2" />
            Đổi mật khẩu
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30 hover:text-info"
          >
            <Bell className="h-4 w-4 mr-2" />
            Cài đặt thông báo
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30 hover:text-destructive"
          >
            <ShieldBan className="size-4 mr-2" />
            Chặn & Báo cáo
          </Button>
        </div>
        
        {/* <div className="pt-4 border-t border-border/30">
          <h4 className="font-medium mb-3 text-destructive">
            Khu vực nguy hiểm
          </h4>
          <Button variant="destructive" className="w-full">
            Xoá tài khoản
          </Button>
        </div> */}
      </CardContent>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </Card>
  );
};

export default PrivacySettings;

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import UserAvatar from "@/components/chat/UserAvatar";
import { userService } from "@/services/userService";
import type { User } from "@/types/user";

interface ViewUserProfileDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
}

const ViewUserProfileDialog = ({ open, setOpen, userId }: ViewUserProfileDialogProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserProfile(userId);
        setUser(data.user);
      } catch (err) {
        setError("Không thể tải thông tin người dùng");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Thông tin cá nhân</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {user && !loading && (
          <Card className="glass-strong border-border/30">
            <CardContent className="space-y-6 pt-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <UserAvatar
                  type="profile"
                  name={user.displayName || "User"}
                  avatarUrl={user.avatarUrl}
                />
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Tên hiển thị</Label>
                <Input
                  id="displayName"
                  value={user.displayName || ""}
                  disabled
                  className="glass-light border-border/30 bg-muted"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Tên người dùng</Label>
                <Input
                  id="username"
                  value={user.username || ""}
                  disabled
                  className="glass-light border-border/30 bg-muted"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="glass-light border-border/30 bg-muted"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={user.phone || "Chưa cập nhật"}
                  disabled
                  className="glass-light border-border/30 bg-muted"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Giới thiệu</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={user.bio || "Chưa có giới thiệu"}
                  disabled
                  className="glass-light border-border/30 bg-muted resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewUserProfileDialog;

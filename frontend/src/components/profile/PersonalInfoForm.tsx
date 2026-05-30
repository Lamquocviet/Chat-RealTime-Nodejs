import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useUserStore } from "@/stores/useUserStore";
import type { User } from "@/types/user";
import type { UpdateProfileData } from "@/types/store";

type EditableField = {
  key: keyof Pick<User, "displayName" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile } = useUserStore();

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<UpdateProfileData>({
    displayName: "",
    email: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (!userInfo) return;

    setFormData({
      displayName: userInfo.displayName ?? "",
      email: userInfo.email ?? "",
      phone: userInfo.phone ?? "",
      bio: userInfo.bio ?? "",
    });
  }, [userInfo]);

  if (!userInfo) return null;

  const handleChange = (
    key: keyof UpdateProfileData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      console.log("formData", formData);
      setIsLoading(true);

      await updateProfile(formData);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>

        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Username chỉ đọc */}
        <div className="space-y-2">
          <Label htmlFor="username">
            Tên người dùng
          </Label>

          <Input
            id="username"
            value={userInfo.username}
            disabled
            className="glass-light border-border/30"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAL_FIELDS.map(({ key, label, type }) => (
            <div
              key={key}
              className="space-y-2"
            >
              <Label htmlFor={key}>
                {label}
              </Label>

              <Input
                id={key}
                type={type ?? "text"}
                value={formData[key] ?? ""}
                onChange={(e) =>
                  handleChange(
                    key,
                    e.target.value
                  )
                }
                className="glass-light border-border/30"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            Giới thiệu
          </Label>

          <Textarea
            id="bio"
            rows={3}
            value={formData.bio ?? ""}
            onChange={(e) =>
              handleChange(
                "bio",
                e.target.value
              )
            }
            className="glass-light border-border/30 resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {isLoading
            ? "Đang lưu..."
            : "Lưu thay đổi"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import type { Participant } from "@/types/chat";
import { UserPlus, LogOut, Trash2, Shield, Crown, Eye } from "lucide-react";
import AddMemberDialog from "./AddMemberDialog";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

interface GroupMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  conversationId: string;
}

const GroupMemberSheet = ({
  open,
  onOpenChange,
  participants,
  conversationId,
}: GroupMemberSheetProps) => {
  const { user } = useAuthStore();
  const { deleteGroup, leaveGroup, removeGroupMember } = useChatStore();

  
  const [openAddMember, setOpenAddMember] = useState(false);

  const me = participants.find((p) => p._id === user?._id);

  const isOwner = me?.role === "owner";
  const isAdmin = me?.role === "admin";

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "owner":
        return "Nhóm trưởng";
      case "admin":
        return "Quản trị viên";
      default:
        return "Thành viên";
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "owner":
        return <Crown className="size-4 text-yellow-500" />;
      case "admin":
        return <Shield className="size-4 text-blue-500" />;
      default:
        return null;
    }
  };
  const canRemoveMember = (
  member: Participant
) => {
  // Không tự kick mình
  if (member._id === user?._id) {
    return false;
  }

  return isOwner;
};

  const handleRemoveMember = async (
  member: Participant
) => {
  const ok = window.confirm(
    `Xóa ${member.displayName} khỏi nhóm?`
  );

  if (!ok) return;

  await removeGroupMember(
    conversationId,
    member._id
  );
};

  const handleDeleteGroup = async () => {
    const ok = window.confirm("Bạn có chắc muốn giải tán nhóm không?");

    if (!ok) return;

    await deleteGroup(conversationId);

    onOpenChange(false);
  };
  const handleLeaveGroup = async () => {
  const ok = window.confirm(
    "Bạn có chắc muốn rời nhóm?"
  );

  if (!ok) return;

  await leaveGroup(conversationId);

  onOpenChange(false);
};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {" "}
      <SheetContent side="right" className="w-[420px] sm:w-[460px] p-0">
        {" "}
        <div className="h-full flex flex-col">
          {/* Header */}{" "}
          <SheetHeader className="border-b px-6 py-5">
            {" "}
            <SheetTitle className="text-xl">
              Thành viên ({participants.length}){" "}
            </SheetTitle>{" "}
          </SheetHeader>
          {/* Group Actions */}
          <div className="border-b p-4 space-y-2">
            {(isOwner || isAdmin) && (
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setOpenAddMember(true)}
              >
                <UserPlus className="mr-2 size-4" />
                Thêm thành viên
              </Button>
            )}

            {isOwner ? (
              <Button
                className="w-full justify-start cursor-pointer"
                variant="destructive"
                onClick={handleDeleteGroup}
              >
                <Trash2 className="mr-2 size-4" />
                Giải tán nhóm
              </Button>
            ) : (
              <Button
                className="w-full justify-start cursor-pointer"
                variant="destructive"
                onClick={handleLeaveGroup}
              >
                <LogOut className="mr-2 size-4" />
                Rời nhóm
              </Button>
            )}
          </div>
          {/* Member List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Danh sách thành viên</h3>

              <div className="space-y-2">
                {participants.map((member) => {
                  // TODO: thay bằng dữ liệu thật
                  const isFriend = false;

                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          type="sidebar"
                          name={member.displayName}
                          avatarUrl={member.avatarUrl ?? undefined}
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.displayName}</p>

                            {getRoleIcon(member.role)}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {getRoleLabel(member.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
  {!isFriend && (
    <Button
      size="sm"
      variant="secondary"
    >
      Kết bạn
    </Button>
  )}

  <Button
    size="icon"
    variant="outline"
  >
    <Eye className="size-4" />
  </Button>

  {canRemoveMember(member) && (
    <Button
      size="icon"
      variant="destructive"
      onClick={() =>
        handleRemoveMember(member)
      }
    >
      <Trash2 className="size-4" />
    </Button>
  )}
</div>
                      {/* <div className="flex items-center gap-2">
                        {!isFriend && (
                          <Button size="sm" variant="secondary">
                            Kết bạn
                          </Button>
                        )}

                        <Button size="icon" variant="outline">
                          <Eye className="size-4" />
                        </Button>
                      </div> */}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
      <AddMemberDialog
        open={openAddMember}
        onOpenChange={setOpenAddMember}
        participants={participants}
        conversationId={conversationId}
      />
    </Sheet>
  );
};

export default GroupMemberSheet;

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Participant } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  conversationId: string;
}

export default function AddMemberDialog({
  open,
  onOpenChange,
  participants,
  conversationId,
}: AddMemberDialogProps) {
  const { friends, getFriends } = useFriendStore();
  const { addMembersToGroup } = useChatStore();

  useEffect(() => {
    if (open) {
      getFriends();
    }
  }, [open]);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const memberIds = new Set(participants.map((p) => p._id));

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id],
    );
  };

  const handleAddMembers = async () =>{
    try {
      await addMembersToGroup(conversationId, selectedUsers);

    setSelectedUsers([]);
    onOpenChange(false);
    }
    catch (error) {
      console.error("Error adding members:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Thêm thành viên</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />

            <Input placeholder="Nhập tên hoặc số điện thoại" className="pl-9" />
          </div>
        </div>

        {/* Member List */}
        <div className="max-h-[400px] overflow-y-auto">
          {friends.map((user) => {
            const checked = selectedUsers.includes(user._id);
            const alreadyInGroup = memberIds.has(user._id);

            return (
              <label
                key={user._id}
                className={`flex items-center gap-3 px-6 py-3
                  ${alreadyInGroup ? "opacity-60" : "cursor-pointer hover:bg-muted"}`}
              >
                <input
                  type="checkbox"
                  checked={alreadyInGroup || checked}
                  disabled={alreadyInGroup}
                  onChange={() => toggleUser(user._id)}
                  className="size-4"
                />
                <UserAvatar
                  type="sidebar"
                  name={user.displayName}
                  avatarUrl={user.avatarUrl}
                />

                <span className="font-medium">{user.displayName}</span>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>

          <Button disabled={!selectedUsers.length} onClick={handleAddMembers}>
            Xác nhận ({selectedUsers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

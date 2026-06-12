import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, Participant } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import ViewUserProfileDialog from "@/components/profile/ViewUserProfileDialog";
import { useCallStore } from "@/stores/useCallStore";
import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { initializeCall, callState } = useCallStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  let otherUser: Participant | null = null;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return;
  }

  const handleAvatarClick = () => {
    if (chat?.type === "direct" && otherUser) {
      setSelectedUserId(otherUser._id);
      setProfileOpen(true);
    }
  };

  const handleVideoCall = async () => {
    if (!otherUser) return;

    if (callState.status !== "idle") {
      toast.error("Có cuộc gọi đang diễn ra");
      return;
    }

    if (!onlineUsers.includes(otherUser._id)) {
      toast.error("Người dùng đang offline");
      return;
    }

    try {
      await initializeCall(otherUser._id, {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
      }, "video");
      toast.success("Đang gọi video đến " + otherUser.displayName);
    } catch (error) {
      console.error("Lỗi khi khởi tạo cuộc gọi video:", error);
      toast.error("Lỗi khi bắt đầu cuộc gọi video");
    }
  };

  const handleAudioCall = async () => {
    if (!otherUser) return;

    if (callState.status !== "idle") {
      toast.error("Có cuộc gọi đang diễn ra");
      return;
    }

    if (!onlineUsers.includes(otherUser._id)) {
      toast.error("Người dùng đang offline");
      return;
    }

    try {
      await initializeCall(otherUser._id, {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
      }, "audio");
      toast.success("Đang gọi thoại đến " + otherUser.displayName);
    } catch (error) {
      console.error("Lỗi khi khởi tạo cuộc gọi thoại:", error);
      toast.error("Lỗi khi bắt đầu cuộc gọi thoại");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="p-2 w-full flex items-center gap-3">
            {/* avatar */}
            <div className="relative">
              {chat.type === "direct" ? (
                <>
                  <UserAvatar
                    type={"sidebar"}
                    name={otherUser?.displayName || "Moji"}
                    avatarUrl={otherUser?.avatarUrl || undefined}
                    onClick={handleAvatarClick}
                  />
                  <StatusBadge
                    status={
                      onlineUsers.includes(otherUser?._id ?? "")
                        ? "online"
                        : "offline"
                    }
                  />
                </>
              ) : (
                <GroupChatAvatar
                  participants={chat.participants}
                  type="sidebar"
                />
              )}
            </div>

            {/* name */}
            <h2 className="font-semibold text-foreground">
              {chat.type === "direct"
                ? otherUser?.displayName
                : chat.group?.name}
            </h2>
          </div>

          {/* Call buttons - only show for direct chat */}
          {chat.type === "direct" && (
            <div className="flex gap-2">
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={handleAudioCall}
                disabled={
                  !onlineUsers.includes(otherUser?._id ?? "") ||
                  callState.status !== "idle"
                }
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Phone className="size-5" />
              </Button> */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVideoCall}
                disabled={
                  !onlineUsers.includes(otherUser?._id ?? "") ||
                  callState.status !== "idle"
                }
                
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Video className="size-7 cursor-pointer"  />
              </Button>
            </div>
          )}
        </div>
      </header>

      {selectedUserId && (
        <ViewUserProfileDialog
          open={profileOpen}
          setOpen={setProfileOpen}
          userId={selectedUserId}
        />
      )}
    </>
  );
};

export default ChatWindowHeader;

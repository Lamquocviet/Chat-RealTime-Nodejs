import { useFriendStore } from "@/stores/useFriendStore";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { MessageCircleMore, Users } from "lucide-react";
import { Card } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { useChatStore } from "@/stores/useChatStore";
import { useState } from "react";

const FriendListModal = () => {
  const { friends, searchByUsername } = useFriendStore();
  const { createConversation } = useChatStore();
  const [username, setUsername] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);

  const handleAddConversation = async (friendId: string) => {
    await createConversation("direct", "", [friendId]);
  };

  const handleSearch = async () => {
    if (!username.trim()) return;

    const user = await searchByUsername(username);
    setSearchResults(user);
  };

  return (
    <DialogContent className="glass max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl capitalize">
          <MessageCircleMore className="size-5" />
          bắt đầu hội thoại mới
        </DialogTitle>
        <DialogDescription>
          Chọn một bạn bè để bắt đầu cuộc trò chuyện trực tiếp
        </DialogDescription>
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Nhập username..."
            className="flex-1 rounded-md border px-3 py-2"
          />

          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-md bg-primary text-white"
          >
            Tìm
          </button>
          {/* Search Result */}
          {searchResults && (
            <Card
              className="p-3 cursor-pointer"
              onClick={() => handleAddConversation(searchResults._id)}
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  type="sidebar"
                  name={searchResults.displayName}
                  avatarUrl={searchResults.avatarUrl}
                />

                <div>
                  <p className="font-medium">{searchResults.displayName}</p>

                  <p className="text-sm text-muted-foreground">
                    @{searchResults.username}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogHeader>

      {/* friends list */}
      <div className="space-y-4">
        <h1 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          danh sách bạn bè
        </h1>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {friends
            .filter(
              (friend) =>
                friend &&
                friend.displayName &&
                friend.displayName.trim() !== "",
            )
            .map((friend) => (
              <Card
                onClick={() => handleAddConversation(friend._id)}
                key={friend._id}
                className="p-3 cursor-pointer transition-smooth hover:shadow-soft glass hover:bg-muted/30 group/friendCard"
              >
                <div className="flex items-center gap-3">
                  {/* avatar */}
                  <div className="relative">
                    <UserAvatar
                      type="sidebar"
                      name={friend.displayName || ""}
                      avatarUrl={friend.avatarUrl}
                    />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h2 className="font-semibold text-sm truncate">
                      {friend.displayName || "Người dùng"}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      @{friend.username}
                    </span>
                  </div>
                </div>
              </Card>
            ))}

          {friends.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="size-12 mx-auto mb-3 opacity-50" />
              Chưa có bạn bè. Thêm bạn vô để tám!
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

export default FriendListModal;

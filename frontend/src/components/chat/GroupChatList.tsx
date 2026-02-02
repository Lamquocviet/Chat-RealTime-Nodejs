import { useChatStore } from "@/stores/useChatStore";

import GroupMessageCard from "./GroupChatCard";
import GroupChatCard from "./GroupChatCard";

const GroupChatList = () => {
  const { conversations } = useChatStore();
  if (!conversations) return;
  const groupChats = conversations.filter((convo) => convo.type === "group");

  return (
    <div className="flex-1 overflow-auto-y p-2 space-y-2">
      {groupChats.map((convo) => (
        <GroupChatCard convo={convo} />
      ))}
    </div>
  );
};

export default GroupChatList;

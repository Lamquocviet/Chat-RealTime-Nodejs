import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatWindowSkeleton from "./ChatWindowSkeleton";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect } from "react";

const ChatWindowLayout = () => {

  const {activeConversationId, conversations, messageLoading: loading, messages, markAsSeen} = useChatStore();

  const selectConvo = conversations.find((c) => c?._id === activeConversationId);

  // Move useEffect before any early returns to follow Rules of Hooks
  useEffect(() =>{
    if(!selectConvo)
      return;
  
    const markSeen = async () => {
      try {
        await markAsSeen();

      } catch (error) {
          console.error("Lỗi khi gọi markSeen", error)
      }
    }
    markSeen();
  },[markAsSeen, selectConvo])

  if(!selectConvo) {
    return <ChatWelcomeScreen />;
  }

  if(loading) {

    return  <ChatWindowSkeleton />;
  }

  return (
    <SidebarInset>
      {/* header  */}
      <ChatWindowHeader />

      {/* Body */}
      <ChatWindowBody />
      {/* footer */}
      <MessageInput selectedConvo={selectConvo} />
    </SidebarInset>
  )
};

export default ChatWindowLayout;

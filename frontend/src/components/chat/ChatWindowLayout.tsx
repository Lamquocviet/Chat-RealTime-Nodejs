import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatWindowSkeleton from "./ChatWindowSkeleton";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";

const ChatWindowLayout = () => {

  const {activeConversationId, conversations, messageLoading: loading, messages} = useChatStore();

  const selectConvo = conversations.find((c) => c?._id === activeConversationId);

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

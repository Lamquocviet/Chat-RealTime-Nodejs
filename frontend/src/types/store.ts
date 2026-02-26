import type { Message } from "react-hook-form";
import type { Conversation } from "./chat";
import type { User } from "./user";
import type { Socket } from "socket.io-client";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}
export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite scroll
      nextCursor?: string | null; // phan trang
    }
  >;
  convoLoading: boolean;
  messageLoading: boolean;
  activeConversationId: string | null;

  reset(): void;
  setActiveConversations: (id: string | null) => void;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;

  sendDirectMessage: (recipientId: string, content: string, imgUrl?: string) => Promise<void>;
  sendGroupMessage: (conversationId: string, content: string, imgUrl?: string) => Promise<void>;

  // add message
  addMessage: (message: Message) => Promise<void>

  
  updateConversation: (conversation: unknown) => void

  markAsSeen: () => Promise<void>
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  loading: boolean;
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
}
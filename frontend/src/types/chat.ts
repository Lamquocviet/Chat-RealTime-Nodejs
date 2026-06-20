export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: "owner" | "admin" | "member";
  joinedAt: string;

}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface LastMessage {
  _id: string;
  content: string | null;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: "text" | "image" | "file";
  attachments: Attachment[];
  imgUrl?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
}

// ====== CALL TYPES ======
export interface Call {
  _id: string;
  caller: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  receiver: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  type: "audio" | "video";
  status: "missed" | "accepted" | "rejected" | "ended";
  startedAt?: string;
  endedAt?: string;
  duration?: number; // in seconds
  createdAt: string;
  updatedAt: string;
}

export interface CallState {
  callId: string | null;
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  callerId: string | null;
  receiverId: string | null;
  offer?: RTCSessionDescriptionInit; // Lưu offer cho receiver
  callerInfo?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  receiverInfo?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  isAudioOn: boolean;
  isVideoOn: boolean;
  duration: number; // in seconds
}


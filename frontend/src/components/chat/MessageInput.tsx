import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const canSend = value.trim().length > 0 || files.length > 0;

  const sendMessage = async () => {
    if (!canSend) return;

    const currValue = value;
    const selectedFiles = files;

    setValue("");
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.find((p) => p._id !== user._id);

        if (!otherUser) {
          toast.error("Không tìm thấy người nhận.");
          return;
        }

        await sendDirectMessage(
          otherUser._id,
          currValue,
          selectedFiles.length > 0 ? selectedFiles : undefined,
        );
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          currValue,
          selectedFiles.length > 0 ? selectedFiles : undefined,
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setFiles(Array.from(e.target.files));
  };

  return (
    <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className="hover:bg-primary/10 transition-smooth cursor-pointer"
      >
        <Paperclip className="size-4" />
      </Button>

      <div className="flex-1">
        <div className="relative">
          <Input
            onKeyPress={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            multiple
            hidden
            onChange={handleFileChange}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1 px-1">
            {files.map((file) => (
              <span
                key={`${file.name}-${file.size}`}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {file.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={sendMessage}
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!canSend}
      >
        <Send className="size-4 text-white" />
      </Button>
    </div>
  );
};

export default MessageInput;

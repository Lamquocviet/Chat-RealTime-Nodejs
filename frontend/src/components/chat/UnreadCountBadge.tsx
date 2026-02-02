import { Badge } from "lucide-react";
import React from "react";

const UnreadCountBadge = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="pulse-ring absolute z-20 -top-1 -right-1">
      <Badge className="size-5 text-xs bg-gradient-chat boder-background">
        {unreadCount > 9 ? "9+" : unreadCount}
      </Badge>
    </div>
  );
};

export default UnreadCountBadge;

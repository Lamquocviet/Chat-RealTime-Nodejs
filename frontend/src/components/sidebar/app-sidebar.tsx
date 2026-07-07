import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Moon, Sun, LayoutGrid, FileText } from "lucide-react";
import { Switch } from "../ui/switch";
import CreateNewChat from "../chat/CreateNewChat";
import NewGroupChatModal from "../chat/NewGroupChatModal";
import GroupChatList from "../chat/GroupChatList";
import AddFriendModal from "../chat/AddFriendModal";
import DirectMessageList from "../chat/DirectMessageList";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ConversationSkeleton from "../skeleton/ConversationSkeleton";
import { useChatStore } from "@/stores/useChatStore";
import { Link } from "react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { convoLoading } = useChatStore();
  const isAdmin = user?.role === "admin";



  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="bg-gradient-primary"
            >
              <a href="#">
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Message</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon className="size-4 text-white/80" />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="beautiful-scrollbar">
        {/* Admin Section - Only show if user is admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase text-primary font-bold">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-2"
                    >
                      <LayoutGrid className="size-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/admin/user-management"
                      className="flex items-center gap-2"
                    >
                      <LayoutGrid className="size-4" />
                      <span>Quản lý người dùng</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to ="/admin/audit-logs"
                      className="flex items-center gap-2"
                    >
                      <FileText className="size-4" />
                      <span>Audit Logs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!isAdmin && (
          <>
            {/* New Chat */}
            <SidebarGroup>
              <SidebarGroupContent>
                <CreateNewChat />
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Group Chat */}
            <SidebarGroup>
              <div className="flex items-center justify-between">
                <SidebarGroupLabel className="uppercase">
                  nhóm chat
                </SidebarGroupLabel>
                <NewGroupChatModal />
              </div>

              <SidebarGroupContent>
                {convoLoading ? <ConversationSkeleton /> : <GroupChatList />}
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Dirrect Message */}
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase">
                bạn bè
              </SidebarGroupLabel>
              <SidebarGroupAction title="Kết Bạn" className="cursor-pointer">
                <AddFriendModal />
              </SidebarGroupAction>

              <SidebarGroupContent>
                {convoLoading ? (
                  <ConversationSkeleton />
                ) : (
                  <DirectMessageList />
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}

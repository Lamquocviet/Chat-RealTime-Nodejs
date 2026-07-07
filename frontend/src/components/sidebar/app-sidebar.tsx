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
import { Moon, Sun, LayoutGrid, FileText, FileTextIcon } from "lucide-react";
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
import { NavLink } from "react-router";

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
                  <NavLink to="/admin/dashboard">
                    {({ isActive }) => (
                      <SidebarMenuButton
                        className={`h-11 rounded-xl transition-all duration-300
                        ${
                          isActive
                            ? "font-semibold bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border border-violet-200"
                            : "hover:bg-violet-50 hover:text-violet-600"
                        }
                      `}
                      >
                        <LayoutGrid className="size-4" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  {/* <SidebarMenuButton asChild> */}
                  <NavLink to="/admin/user-management">
                    {({ isActive }) => (
                      <SidebarMenuButton
                        className={`h-11 rounded-xl transition-all duration-300
                        ${
                          isActive
                            ? "font-semibold bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border border-violet-200"
                            : "hover:bg-violet-50 hover:text-violet-600"
                        }
                      `}
                      >
                        <LayoutGrid className="size-4" />
                        <span>User Management</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                  {/* </SidebarMenuButton> */}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  {/* <SidebarMenuButton asChild> */}
                  <NavLink to="/admin/audit-logs">
                    {({ isActive }) => (
                      <SidebarMenuButton
                        className={`h-11 rounded-xl transition-all duration-300
                        ${
                          isActive
                            ? "font-semibold bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border border-violet-200"
                            : "hover:bg-violet-50 hover:text-violet-600"
                        }
                      `}
                      >
                        <FileTextIcon className="size-4" />
                        <span>Audit Logs</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                  {/* </SidebarMenuButton> */}
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

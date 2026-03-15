import { useFriendStore } from "@/stores/useFriendStore";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Users, UserPlus } from "lucide-react";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Form } from "react-router";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import IniviteSuggestionList from "../newGroupChat/InviteSuggestionList";
import { SelectedUserList } from "../newGroupChat/SelectedUserList";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const NewGroupChatModal = () => {

  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const {friends, getFriends} = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const {loading, createConversation} = useChatStore();

  const handleGetFriends = async() =>{
    await getFriends();
  }
  const handleSelectFriends = (friend: Friend) => {
    setInvitedUsers([...invitedUsers, friend]);
    setSearch("");

  }
  const handleRemoveFriend = (friend : Friend) => {
    setInvitedUsers(invitedUsers.filter((u) => u._id !== friend._id));
  }

  const handleSubmit = async(e: React.FormEvent) => {
    try {
      e.preventDefault();
      if(invitedUsers.length === 0)
      {
        toast.warning("Bạn phải mời ít nhất 1 thành viên vào nhóm");
        return;
      }
      await createConversation(
        "group",
        "groupName",
        invitedUsers.map((u) => u._id)
      )

      setSearch("");
      setInvitedUsers([]);
    } catch (error) {
      console.error("Lỗi xảy ra khi handleSubmit trong NewGroupChatModal:", error);
    }
  }
  
  const filteredFriends = friends.filter((friend) => friend.displayName.toLowerCase().includes(search.toLowerCase()) && !invitedUsers.some((u) => u._id === friend._id));


  return (
    <Dialog>
      <DialogTrigger asChild>
        
       <Button variant = "ghost" onClick={handleGetFriends} className="flex z-10 justify-center items-center rounded-full size-5 hover:bg-sidebar-accent transition cursor-pointer " >
          <Users className="size-4"/>
          <span className="sr-only">Tạo nhóm chat</span>
       </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle className="capitalize">
            Tạo nhóm chat mới
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={() =>{}}>
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-semibold">
             Tên nhóm
          </Label>
          <Input 
            id = "groupName"
            className="glass border-border/50 focus:border-primary/50 transition-smooth"
            placeholder="Gõ tên nhóm vào đây ..."
            value = {groupName} 
            onChange={(e) => setGroupName(e.target.value)}
          
            required
          />
          </div>


          {/* Mời thành viên */}
          <div className="space-y-2">
            <Label htmlFor="invite" className="text-sm font-semibold">
              Mời thành viên
            </Label>
            <Input
              id="invite"
              placeholder="Tìm theo tên hiển thị ..."
              className="flex-1"
              value={search}
              onChange={(e)=> setSearch(e.target.value)}
            />
          </div>

          {/* Danh sách gợi ý */}
          {search && filteredFriends.length > 0 && (
             <IniviteSuggestionList filteredFriends={filteredFriends} onSelect = {handleSelectFriends} />
          )}
          {/* danh sách đã lựa chọn  */}
          <SelectedUserList inviteUsers={invitedUsers} onRemove={handleRemoveFriend}/>
         
         <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth cursor-pointer"
            >
              {loading ? (
                <span>Đang tạo...</span>
              ) : (
                <>
                  <UserPlus className="size-4 mr-2" />
                  Tạo nhóm
                </>
              )}
            </Button>
          </DialogFooter>


        </form>
      </DialogContent>
    </Dialog>
  )
};

export default NewGroupChatModal;

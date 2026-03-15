import React from 'react'
import type { Friend } from '@/types/user';
import UserAvatar from '../chat/UserAvatar';
import { X } from 'lucide-react';

interface SelectedUserListProps {
    inviteUsers: Friend[];
    onRemove: (user: Friend) => void;

}
export const SelectedUserList = ({inviteUsers, onRemove}:SelectedUserListProps) => {

  if(inviteUsers.length === 0) 
    return;

  return (
    <div className='flex flex-wrap pt-2 gap-2'>
      {inviteUsers.map((user)=> (
        <div key={user._id}
          className='flex items-center gap-1 bg-muted text-sm rounded-full px-3 py-2'>
             <UserAvatar
            type="chat"
            name={user.displayName}
            avatarUrl={user.avatarUrl}
          />
          <span>{user.displayName}</span>

          <X
            className="size-3 cursor-pointer hover:text-destructive"
            onClick={() => onRemove(user)}
          />
        </div>
      ))}
    </div>
  )
}

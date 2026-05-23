'use client';

import React, { useState, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { chatApi, Conversation } from '@/lib/api/chatApi';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import { getRelativeTimeString } from '@/lib/utils/dateUtils';
import { MessageSquare, Users, Loader2, Search, MoreVertical, MessageCircle, ChevronDown, Pin, Trash2, AlertTriangle } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { OnlineStatus } from '@/components/chat/OnlineStatus';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { Modal } from '@/components/ui/Modal';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { PageLayout } from '@/components/layout/PageLayout';

// Normalize doctor names: always prepend "Dr." if role is Doctor and not already present
const getDisplayName = (name: string, role: string) => {
  if (role?.toLowerCase() === 'doctor' && !name.toLowerCase().startsWith('dr.')) {
    return `Dr. ${name}`;
  }
  return name;
};

export default function PatientMessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [tempContact, setTempContact] = useState<Conversation | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [dropdownOpenFor, setDropdownOpenFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`pinned_chats_${user.id}`);
      if (saved) {
        try { setPinnedChats(JSON.parse(saved)); } catch (e) { }
      }
    }
  }, [user?.id]);

  const togglePin = (otherUserId: string) => {
    if (!user?.id) return;
    const isPinned = pinnedChats.includes(otherUserId);
    const updated = isPinned
      ? pinnedChats.filter(id => id !== otherUserId)
      : [...pinnedChats, otherUserId];

    setPinnedChats(updated);
    localStorage.setItem(`pinned_chats_${user.id}`, JSON.stringify(updated));
    toast.success(isPinned ? 'Chat unpinned' : 'Chat pinned');
    setDropdownOpenFor(null);
  };

  const handleDeleteChat = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await chatApi.deleteConversation(deletingId);
      if (selectedConversation?.otherUserId === deletingId) {
        setSelectedConversation(null);
      }

      // Clear message history cache & presence cache for this user
      queryClient.removeQueries({ queryKey: ['chat', 'conversation', deletingId] });
      queryClient.removeQueries({ queryKey: ['chat', 'onlineStatus', deletingId] });

      // Invalidate general chat queries
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });

      toast.success('Conversation deleted permanently');
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete chat', err);
      toast.error('Failed to delete the conversation.');
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 15000,
  });

  const handleSelectContact = (contact: Partial<Conversation>) => {
    // Check if we already have a conversation with this person
    // Matches by ID or by Case-Insensitive name for better reliability
    const existing = conversations.find(c => 
      c.otherUserId === contact.otherUserId ||
      c.otherUserName.toLowerCase() === contact.otherUserName?.toLowerCase()
    );

    if (existing) {
      setSelectedConversation({ ...existing, isNew: false });
      setTempContact(null);
    } else {
      // Start a new conversation (temporary object)
      const newConv = { ...contact, isNew: true } as Conversation;
      setSelectedConversation(newConv);
      setTempContact(newConv);
    }
  };

  // Synchronize tempContact with real conversations list once it arrives from backend
  React.useEffect(() => {
    if (tempContact && conversations.length > 0) {
      const match = conversations.find(c => 
        c.otherUserId === tempContact.otherUserId || 
        c.otherUserName.toLowerCase() === tempContact.otherUserName.toLowerCase() ||
        // Handle "Dr. " prefix mismatch
        c.otherUserName.toLowerCase().replace(/^dr\.?\s+/i, '') === 
        tempContact.otherUserName.toLowerCase().replace(/^dr\.?\s+/i, '')
      );
      
      if (match) {
        setTempContact(null);
        // If the selected conversation is the temp one, switch to the real one
        if (selectedConversation?.otherUserId === tempContact.otherUserId) {
          setSelectedConversation(match);
        }
      }
    }
  }, [conversations, tempContact, selectedConversation]);

  // Global Esc key listener to close chat
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Only close conversation if no modal is covering the screen
        if (isNewChatOpen || deletingId) return;
        setSelectedConversation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewChatOpen, deletingId]);

  const filteredConversations = conversations.filter(c =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Merge temporary contact into the list if it matches the search and isn't already there
  let displayConversations = [...filteredConversations];
  if (tempContact &&
    !displayConversations.some(c => c.otherUserId === tempContact.otherUserId) &&
    tempContact.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())) {
    displayConversations.unshift(tempContact);
  }

  // Sort by pinned, then by latest message
  const sortedConversations = useMemo(() => {
    return [...displayConversations].sort((a, b) => {
      const aPinned = pinnedChats.includes(a.otherUserId);
      const bPinned = pinnedChats.includes(b.otherUserId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [displayConversations, pinnedChats]);

  if (!user) return null;

  return (
    <PageLayout withPadding={false}>
      <div className="flex flex-col h-[calc(100vh-180px)] w-full animate-in fade-in duration-500">
      {/* Premium Chat Card */}
      <div className="flex-1 flex bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">

        {/* Sidebar: Conversation List */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 flex flex-col border-r border-slate-100 dark:border-slate-800 z-20 relative overflow-hidden">

          <NewChatModal
            isOpen={isNewChatOpen}
            onClose={() => setIsNewChatOpen(false)}
            onSelectContact={handleSelectContact}
            role="Patient"
          />

          {/* Sidebar Header: Standardized Height */}
          <div className="h-[96px] px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Inbox</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Messages</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Area */}
          <div className="p-4 bg-slate-50/20 dark:bg-slate-900/20">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-1 px-2 pt-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-5 rounded-2xl animate-pulse">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/60 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-full w-24" />
                        <div className="h-2 bg-slate-50 dark:bg-slate-800/40 rounded-full w-10" />
                      </div>
                      <div className="h-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-full w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-rose-50/30 dark:bg-rose-900/10 m-4 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Connection Error</p>
              </div>
            ) : displayConversations.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No active chats</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-2 pb-4 pt-2">
                {sortedConversations.map((conv) => (
                  <div
                    key={conv.otherUserId}
                    onClick={() => setSelectedConversation(conv)}
                    onMouseLeave={() => setDropdownOpenFor(null)}
                    className={`group flex items-center gap-4 px-4 py-5 cursor-pointer transition-all rounded-2xl relative ${selectedConversation?.otherUserId === conv.otherUserId
                        ? 'bg-slate-100 dark:bg-slate-800/90'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar 
                        src={conv.otherUserProfilePictureUrl}
                        gender={conv.otherUserGender}
                        name={conv.otherUserName}
                        className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 shadow-md"
                      />
                      <div className="absolute bottom-0 right-0 border-2 border-white dark:border-slate-900 rounded-full overflow-hidden shadow-sm">
                        <OnlineStatus isOnline={conv.isOnline} size="md" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">
                          {getDisplayName(conv.otherUserName, conv.otherUserRole)}
                        </h3>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] font-black text-slate-400 shrink-0 uppercase tracking-tighter">
                            {getRelativeTimeString(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2 mt-0.5">
                        <p className={`text-[13px] truncate leading-tight flex-1 ${conv.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                          {conv.lastMessageText || 'No messages yet'}
                        </p>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {conv.unreadCount > 0 && (
                            <div className="min-w-[18px] h-4.5 bg-emerald-600 rounded-full flex items-center justify-center px-1.5 text-[8px] text-white font-black shadow-lg shadow-emerald-500/30 animate-pulse">
                              {conv.unreadCount}
                            </div>
                          )}

                          <div className="relative w-5 h-5 flex items-center justify-center">
                            {/* Pinned Icon (always visible if pinned and not hovering) */}
                            {pinnedChats.includes(conv.otherUserId) && dropdownOpenFor !== conv.otherUserId && (
                              <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity pointer-events-none">
                                <Pin className="w-3.5 h-3.5 text-slate-400 rotate-45" fill="currentColor" />
                              </div>
                            )}

                            {/* Dropdown Trigger */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setDropdownOpenFor(dropdownOpenFor === conv.otherUserId ? null : conv.otherUserId); }}
                              className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 ${dropdownOpenFor === conv.otherUserId ? '!opacity-100' : ''}`}
                            >
                              <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors" />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpenFor === conv.otherUserId && (
                              <div className="absolute right-6 top-0 z-50 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 overflow-hidden animate-in zoom-in-95 duration-100 origin-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePin(conv.otherUserId); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                >
                                  <Pin className={`w-3.5 h-3.5 ${pinnedChats.includes(conv.otherUserId) ? 'rotate-0' : 'rotate-45'}`} />
                                  {pinnedChats.includes(conv.otherUserId) ? 'Unpin' : 'Pin chat'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeletingId(conv.otherUserId); setDropdownOpenFor(null); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete 
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Area: Chat Window */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/20 relative">
          {selectedConversation ? (
            <div className="h-full animate-in fade-in slide-in-from-right-8 duration-700">
              <ChatWindow
                key={selectedConversation.otherUserId}
                currentUserId={user.id}
                otherUserId={selectedConversation.otherUserId}
                otherUserName={getDisplayName(selectedConversation.otherUserName, selectedConversation.otherUserRole)}
                otherUserRole={selectedConversation.otherUserRole}
                otherUserProfilePictureUrl={selectedConversation.otherUserProfilePictureUrl}
                otherUserGender={selectedConversation.otherUserGender}
                isNew={selectedConversation.isNew}
                className="h-full"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-indigo-500/10 blur-[50px] rounded-full" />
                <div className="relative w-28 h-28 flex items-center justify-center grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                  <Image 
                    src="/images/logo.png" 
                    alt="System Logo" 
                    width={100} 
                    height={100}
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900/40 dark:text-white/40 mb-3 uppercase tracking-tight">Personal Inbox</h3>
              <p className="text-slate-500/40 dark:text-slate-400/40 max-w-sm text-[11px] font-bold leading-relaxed uppercase tracking-widest">
                Select a doctor to access end-to-end encrypted medical communication.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => !isDeleting && setDeletingId(null)}
        maxWidth="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center mb-6 border border-red-100 dark:border-red-900/20 shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            Delete Chat
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            Are you sure you want to permanently delete this conversation? This action cannot be undone.
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </PageLayout>
  );
}

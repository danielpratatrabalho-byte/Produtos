import { useEffect, useState, useCallback } from 'react';
import { signInAnonymously } from 'firebase/auth';
import {
  auth,
  createUserProfile,
  updateUserStatus,
  addFriend,
  removeFriend,
  getFriends,
  createGroup,
  addMemberToGroup,
  getGroupsForUser,
  sendMessage,
  getOrCreateConversation,
  listenToMessages,
  listenToConversations,
  listenToNotes,
  createNote,
  updateNote,
  deleteNote,
  generateUserCode,
} from '@/lib/firebase';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userIdFromStorage = localStorage.getItem('userId');
        if (userIdFromStorage) {
          setUserId(userIdFromStorage);
        } else {
          const result = await signInAnonymously(auth);
          const newUserId = result.user.uid;
          localStorage.setItem('userId', newUserId);
          setUserId(newUserId);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return { userId, loading };
};

export const useUserProfile = (userId: string | null) => {
  const [userCode, setUserCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const initProfile = async () => {
      try {
        const codeFromStorage = localStorage.getItem('userCode');
        if (codeFromStorage) {
          setUserCode(codeFromStorage);
        } else {
          const username = localStorage.getItem('username') || `User_${userId.slice(0, 6)}`;
          const avatar = localStorage.getItem('avatar') || '👤';
          const code = await createUserProfile(userId, username, avatar);
          localStorage.setItem('userCode', code);
          localStorage.setItem('username', username);
          localStorage.setItem('avatar', avatar);
          setUserCode(code);
        }
      } catch (error) {
        console.error('Profile error:', error);
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [userId]);

  return { userCode, loading };
};

export const useUserStatus = (userId: string | null) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>('online');

  const updateStatus = useCallback(
    async (newStatus: 'online' | 'offline' | 'busy') => {
      if (!userId) return;
      setStatus(newStatus);
      localStorage.setItem('userStatus', newStatus);
      await updateUserStatus(userId, newStatus);
    },
    [userId]
  );

  useEffect(() => {
    const savedStatus = localStorage.getItem('userStatus') as 'online' | 'offline' | 'busy' | null;
    if (savedStatus) {
      setStatus(savedStatus);
    }
  }, []);

  return { status, updateStatus };
};

export const useFriends = (userId: string | null) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadFriends = async () => {
      try {
        const friendIds = await getFriends(userId);
        setFriends(friendIds);
      } catch (error) {
        console.error('Friends error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [userId]);

  const addNewFriend = useCallback(
    async (friendId: string) => {
      if (!userId) return;
      await addFriend(userId, friendId);
      setFriends([...friends, friendId]);
    },
    [userId, friends]
  );

  const removeFriendById = useCallback(
    async (friendId: string) => {
      if (!userId) return;
      await removeFriend(userId, friendId);
      setFriends(friends.filter(f => f !== friendId));
    },
    [userId, friends]
  );

  return { friends, loading, addNewFriend, removeFriendById };
};

export const useGroups = (userId: string | null) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadGroups = async () => {
      try {
        const userGroups = await getGroupsForUser(userId);
        setGroups(userGroups);
      } catch (error) {
        console.error('Groups error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [userId]);

  const createNewGroup = useCallback(
    async (groupName: string, members: string[]) => {
      if (!userId) return;
      const groupId = await createGroup(groupName, userId, members);
      const newGroup = {
        groupId,
        name: groupName,
        createdBy: userId,
        createdAt: Date.now(),
        members: { [userId]: true, ...members.reduce((acc, m) => ({ ...acc, [m]: true }), {}) },
      };
      setGroups([...groups, newGroup]);
      return groupId;
    },
    [userId, groups]
  );

  const addMember = useCallback(
    async (groupId: string, memberId: string) => {
      await addMemberToGroup(groupId, memberId);
      setGroups(
        groups.map(g =>
          g.groupId === groupId
            ? { ...g, members: { ...g.members, [memberId]: true } }
            : g
        )
      );
    },
    [groups]
  );

  return { groups, loading, createNewGroup, addMember };
};

export const useConversations = (userId: string | null) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = listenToConversations(userId, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, [userId]);

  return { conversations, loading };
};

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, [conversationId]);

  const sendNewMessage = useCallback(
    async (userId: string, text: string) => {
      await sendMessage(conversationId, userId, text);
    },
    [conversationId]
  );

  return { messages, loading, sendNewMessage };
};

export const useNotes = (userId: string | null) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = listenToNotes(userId, (notesList) => {
      setNotes(notesList);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, [userId]);

  const createNewNote = useCallback(
    async (title: string, content: string, color: string) => {
      if (!userId) return;
      await createNote(userId, title, content, color);
    },
    [userId]
  );

  const updateNoteContent = useCallback(
    async (noteId: string, title: string, content: string) => {
      if (!userId) return;
      await updateNote(userId, noteId, title, content);
    },
    [userId]
  );

  const deleteNoteById = useCallback(
    async (noteId: string) => {
      if (!userId) return;
      await deleteNote(userId, noteId);
    },
    [userId]
  );

  return { notes, loading, createNewNote, updateNoteContent, deleteNoteById };
};

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, update, remove } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration
// TODO: Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKey',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://demo.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Utility functions
export const generateUserCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// User operations
export const createUserProfile = async (userId: string, username: string, avatar: string) => {
  const code = generateUserCode();
  const userRef = ref(db, `users/${userId}`);
  await set(userRef, {
    username,
    code,
    avatar,
    status: 'online',
    lastSeen: Date.now(),
    createdAt: Date.now(),
  });
  return code;
};

export const updateUserStatus = async (userId: string, status: 'online' | 'offline' | 'busy') => {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, {
    status,
    lastSeen: Date.now(),
  });
};

export const getUserByCode = async (code: string) => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const [userId, userData] of Object.entries(users)) {
      if ((userData as any).code === code) {
        return { userId, ...(userData as any) };
      }
    }
  }
  return null;
};

// Friends operations
export const addFriend = async (userId: string, friendId: string) => {
  const friendRef = ref(db, `friends/${userId}/${friendId}`);
  await set(friendRef, true);
  
  // Add reverse relationship
  const reverseFriendRef = ref(db, `friends/${friendId}/${userId}`);
  await set(reverseFriendRef, true);
};

export const removeFriend = async (userId: string, friendId: string) => {
  const friendRef = ref(db, `friends/${userId}/${friendId}`);
  await remove(friendRef);
  
  const reverseFriendRef = ref(db, `friends/${friendId}/${userId}`);
  await remove(reverseFriendRef);
};

export const getFriends = async (userId: string) => {
  const friendsRef = ref(db, `friends/${userId}`);
  const snapshot = await get(friendsRef);
  return snapshot.exists() ? Object.keys(snapshot.val()) : [];
};

// Groups operations
export const createGroup = async (groupName: string, createdBy: string, members: string[]) => {
  const groupId = generateId();
  const groupRef = ref(db, `groups/${groupId}`);
  
  const memberObj: Record<string, boolean> = {};
  memberObj[createdBy] = true;
  members.forEach(m => memberObj[m] = true);
  
  await set(groupRef, {
    name: groupName,
    createdBy,
    createdAt: Date.now(),
    members: memberObj,
    sharedLists: {},
  });
  
  return groupId;
};

export const addMemberToGroup = async (groupId: string, userId: string) => {
  const memberRef = ref(db, `groups/${groupId}/members/${userId}`);
  await set(memberRef, true);
};

export const removeMemberFromGroup = async (groupId: string, userId: string) => {
  const memberRef = ref(db, `groups/${groupId}/members/${userId}`);
  await remove(memberRef);
};

export const getGroupsForUser = async (userId: string) => {
  const groupsRef = ref(db, 'groups');
  const snapshot = await get(groupsRef);
  
  if (!snapshot.exists()) return [];
  
  const groups = snapshot.val();
  const userGroups: any[] = [];
  
  for (const [groupId, groupData] of Object.entries(groups)) {
    if ((groupData as any).members[userId]) {
      userGroups.push({ groupId, ...(groupData as any) });
    }
  }
  
  return userGroups;
};

// Messages operations
export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  const messagesRef = ref(db, `messages/${conversationId}`);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    senderId,
    text,
    timestamp: Date.now(),
    read: false,
  });
};

export const getOrCreateConversation = async (
  userId: string,
  otherUserId: string,
  type: 'direct' | 'group' = 'direct'
) => {
  // For direct conversations, create a consistent ID
  const conversationId = type === 'direct' 
    ? [userId, otherUserId].sort().join('_')
    : `group_${generateId()}`;
  
  const conversationRef = ref(db, `conversations/${conversationId}`);
  const snapshot = await get(conversationRef);
  
  if (!snapshot.exists()) {
    await set(conversationRef, {
      type,
      participants: {
        [userId]: true,
        [otherUserId]: true,
      },
      createdAt: Date.now(),
      lastMessage: '',
      lastMessageTime: 0,
    });
  }
  
  return conversationId;
};

export const listenToMessages = (
  conversationId: string,
  callback: (messages: any[]) => void
) => {
  const messagesRef = ref(db, `messages/${conversationId}`);
  return onValue(messagesRef, (snapshot: any) => {
    if (snapshot.exists()) {
      const messagesObj = snapshot.val();
      const messages = Object.entries(messagesObj).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }));
      callback(messages.sort((a: any, b: any) => a.timestamp - b.timestamp));
    } else {
      callback([]);
    }
  });
};

export const listenToConversations = (
  userId: string,
  callback: (conversations: any[]) => void
) => {
  const conversationsRef = ref(db, 'conversations');
  return onValue(conversationsRef, (snapshot: any) => {
    if (snapshot.exists()) {
      const conversationsObj = snapshot.val();
      const userConversations: any[] = [];
      
      for (const [convId, convData] of Object.entries(conversationsObj)) {
        if ((convData as any).participants[userId]) {
          userConversations.push({ id: convId, ...(convData as any) });
        }
      }
      
      callback(userConversations.sort((a: any, b: any) => b.lastMessageTime - a.lastMessageTime));
    } else {
      callback([]);
    }
  });
};

// Notes operations
export const createNote = async (userId: string, title: string, content: string, color: string) => {
  const noteId = generateId();
  const noteRef = ref(db, `notes/${userId}/${noteId}`);
  
  await set(noteRef, {
    title,
    content,
    color,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  return noteId;
};

export const updateNote = async (userId: string, noteId: string, title: string, content: string) => {
  const noteRef = ref(db, `notes/${userId}/${noteId}`);
  await update(noteRef, {
    title,
    content,
    updatedAt: Date.now(),
  });
};

export const deleteNote = async (userId: string, noteId: string) => {
  const noteRef = ref(db, `notes/${userId}/${noteId}`);
  await remove(noteRef);
};

export const listenToNotes = (
  userId: string,
  callback: (notes: any[]) => void
) => {
  const notesRef = ref(db, `notes/${userId}`);
  return onValue(notesRef, (snapshot: any) => {
    if (snapshot.exists()) {
      const notesObj = snapshot.val();
      const notes = Object.entries(notesObj).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }));
      callback(notes.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    } else {
      callback([]);
    }
  });
};

// Shared lists operations
export const shareListWithGroup = async (groupId: string, themeId: string) => {
  const sharedListRef = ref(db, `groups/${groupId}/sharedLists/${themeId}`);
  await set(sharedListRef, true);
};

export const removeListFromGroup = async (groupId: string, themeId: string) => {
  const sharedListRef = ref(db, `groups/${groupId}/sharedLists/${themeId}`);
  await remove(sharedListRef);
};

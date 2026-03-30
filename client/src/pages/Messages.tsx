import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, FileText, Plus, Send, X, LogOut } from 'lucide-react';

interface Friend {
  id: string;
  code: string;
  username: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
}

export default function Messages() {
  const [userId, setUserId] = useState<string>('');
  const [userCode, setUserCode] = useState<string>('');
  const [status, setStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Initialize user on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserCode = localStorage.getItem('userCode');
    const storedFriends = localStorage.getItem('friends');
    const storedNotes = localStorage.getItem('notes');

    if (storedUserId && storedUserCode) {
      setUserId(storedUserId);
      setUserCode(storedUserCode);
    } else {
      const newUserId = `user_${Math.random().toString(36).substring(7)}`;
      const newUserCode = generateUserCode();
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('userCode', newUserCode);
      setUserId(newUserId);
      setUserCode(newUserCode);
    }

    if (storedFriends) {
      setFriends(JSON.parse(storedFriends));
    }

    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, []);

  const generateUserCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAddFriend = () => {
    if (!friendCode.trim()) return;

    const newFriend: Friend = {
      id: `friend_${Math.random().toString(36).substring(7)}`,
      code: friendCode,
      username: `Utilizador ${friendCode}`,
    };

    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
    setShowAddFriendModal(false);
    setFriendCode('');
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedFriend) return;

    const newMessage: Message = {
      id: `msg_${Math.random().toString(36).substring(7)}`,
      sender: userId,
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  const handleCreateNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const newNote: Note = {
      id: `note_${Math.random().toString(36).substring(7)}`,
      title: noteTitle,
      content: noteContent,
      color: 'yellow',
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    setShowNoteModal(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const handleRemoveFriend = (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
    if (selectedFriend === friendId) {
      setSelectedFriend(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary mb-2">Colaboração</h1>
          <div className="flex items-center gap-2 text-sm mb-3">
            <div
              className={`w-2 h-2 rounded-full ${
                status === 'online' ? 'bg-green-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}
            ></div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="text-xs bg-transparent border border-border rounded px-2 py-1"
            >
              <option value="online">Online</option>
              <option value="busy">Ocupado</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          {userCode && (
            <div className="p-2 bg-muted rounded text-xs font-mono">
              Código: <span className="font-bold">{userCode}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="friends" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border">
            <TabsTrigger value="friends" className="flex-1">
              Amigos
            </TabsTrigger>
            <TabsTrigger value="notas" className="flex-1">
              Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2">
                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum amigo ainda</p>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`p-2 rounded mb-2 cursor-pointer flex items-center justify-between group ${
                        selectedFriend === friend.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedFriend(friend.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{friend.username}</p>
                        <p className="text-xs opacity-75">{friend.code}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(friend.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-2 border-t border-border">
              <Button
                onClick={() => setShowAddFriendModal(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Amigo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notas" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2">
                {notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma nota</p>
                ) : (
                  notes.map((note) => (
                    <Card key={note.id} className={`p-2 mb-2 bg-${note.color}-100 border-${note.color}-300`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{note.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="ml-2 opacity-60 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-2 border-t border-border">
              <Button
                onClick={() => setShowNoteModal(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Nota
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <h2 className="text-lg font-bold">
                {friends.find((f) => f.id === selectedFriend)?.username}
              </h2>
              <p className="text-sm text-muted-foreground">
                {friends.find((f) => f.id === selectedFriend)?.code}
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender === userId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card flex gap-2">
              <Input
                placeholder="Escreva uma mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecione um amigo para começar a conversa</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <Dialog open={showAddFriendModal} onOpenChange={setShowAddFriendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Amigo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Código do Amigo</label>
              <Input
                placeholder="Ex: ABC123"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddFriend();
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddFriend} className="flex-1">
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddFriendModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Título da nota"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <textarea
                placeholder="Escreva a sua nota..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateNote} className="flex-1">
                Criar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNoteModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

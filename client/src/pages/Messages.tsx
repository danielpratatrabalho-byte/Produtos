import { useState, useEffect } from 'react';
import { useAuth, useUserProfile, useUserStatus, useFriends, useGroups, useConversations, useMessages, useNotes } from '@/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, FileText, Plus, Send, X } from 'lucide-react';

export default function Messages() {
  const { userId, loading: authLoading } = useAuth();
  const { userCode, loading: profileLoading } = useUserProfile(userId);
  const { status, updateStatus } = useUserStatus(userId);
  const { friends, addNewFriend } = useFriends(userId);
  const { groups, createNewGroup } = useGroups(userId);
  const { conversations } = useConversations(userId);
  const { notes, createNewNote } = useNotes(userId);

  const [activeTab, setActiveTab] = useState('messages');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const { messages, sendNewMessage } = useMessages(selectedConversation || '');

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !userId) return;
    await sendNewMessage(userId, messageText);
    setMessageText('');
  };

  const handleAddFriend = async () => {
    // TODO: Implement friend code lookup and add
    setShowAddFriendModal(false);
    setFriendCode('');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    await createNewGroup(groupName, []);
    setShowCreateGroupModal(false);
    setGroupName('');
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    await createNewNote(noteTitle, noteContent, 'yellow');
    setNoteTitle('');
    setNoteContent('');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary mb-2">Colaboração</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
            <span className="text-muted-foreground">{status}</span>
          </div>
          {userCode && (
            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
              Código: <span className="font-bold">{userCode}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="friends" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border">
            <TabsTrigger value="friends" className="flex-1">Amigos</TabsTrigger>
            <TabsTrigger value="groups" className="flex-1">Grupos</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2">
                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum amigo ainda</p>
                ) : (
                  friends.map(friend => (
                    <button
                      key={friend}
                      onClick={() => setSelectedConversation(friend)}
                      className={`w-full text-left p-2 rounded mb-1 transition ${
                        selectedConversation === friend
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{friend}</div>
                      <div className="text-xs text-muted-foreground">Online</div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
            <Button
              onClick={() => setShowAddFriendModal(true)}
              className="m-2 w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Amigo
            </Button>
          </TabsContent>

          <TabsContent value="groups" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2">
                {groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum grupo ainda</p>
                ) : (
                  groups.map(group => (
                    <button
                      key={group.groupId}
                      onClick={() => setSelectedConversation(group.groupId)}
                      className={`w-full text-left p-2 rounded mb-1 transition ${
                        selectedConversation === group.groupId
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{group.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Object.keys(group.members).length} membros
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
            <Button
              onClick={() => setShowCreateGroupModal(true)}
              className="m-2 w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Novo Grupo
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages Tab */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border p-4 bg-card">
                <h2 className="text-lg font-semibold">Conversa</h2>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.senderId === userId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border p-4 bg-card">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva uma mensagem..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um amigo ou grupo para começar</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes Panel */}
        <div className="border-l border-border w-80 bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas Rápidas
            </h3>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center">Nenhuma nota</p>
              ) : (
                notes.map(note => (
                  <Card key={note.id} className="p-3 bg-yellow-50 dark:bg-yellow-950">
                    <h4 className="font-medium text-sm truncate">{note.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {note.content}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border space-y-2">
            <Input
              placeholder="Título da nota..."
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              className="text-sm"
            />
            <textarea
              placeholder="Conteúdo..."
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              className="w-full text-xs p-2 border border-border rounded resize-none h-20"
              maxLength={500}
            />
            <Button onClick={handleCreateNote} className="w-full" size="sm">
              Adicionar Nota
            </Button>
          </div>
        </div>
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
                placeholder="Ex: JDKF92"
                value={friendCode}
                onChange={e => setFriendCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button onClick={handleAddFriend} className="w-full">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Grupo</label>
              <Input
                placeholder="Ex: Compras de Casa"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateGroup} className="w-full">
              Criar Grupo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

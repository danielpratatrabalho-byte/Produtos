# Arquitetura de Colaboração - Product List Hub

## 1. Visão Geral

Este documento descreve como transformar a sua aplicação de lista de produtos numa plataforma colaborativa com:
- **Mensagens em tempo real** entre amigos e grupos
- **Sistema de amigos** com códigos de convite (como a partilha de temas)
- **Grupos de trabalho** para listas compartilhadas
- **Mini bloco de notas** para anotações rápidas
- **Status online/offline** com utilidade real

### Tecnologia

- **Frontend**: React 19 + Tailwind 4 (mantém compatibilidade com GitHub Pages)
- **Backend em Tempo Real**: Firebase Realtime Database (gratuito, sem servidor)
- **Autenticação**: Firebase Anonymous + identificação por código único
- **Armazenamento Local**: LocalStorage (sincronização offline-first)

---

## 2. Modelo de Dados

### 2.1 Estrutura Firebase

```
firebase/
├── users/
│   └── {userId}/
│       ├── username: string
│       ├── code: string (código único para adicionar como amigo)
│       ├── status: "online" | "offline" | "busy"
│       ├── lastSeen: timestamp
│       ├── createdAt: timestamp
│       └── avatar: string (emoji ou cor)
│
├── friends/
│   └── {userId}/
│       └── {friendId}: true
│
├── groups/
│   └── {groupId}/
│       ├── name: string
│       ├── createdBy: userId
│       ├── createdAt: timestamp
│       ├── members: { userId: true, ... }
│       └── sharedLists: { themeId: true, ... }
│
├── messages/
│   └── {conversationId}/
│       └── {messageId}/
│           ├── senderId: string
│           ├── text: string
│           ├── timestamp: number
│           ├── read: boolean
│
├── conversations/
│   └── {conversationId}/
│       ├── type: "direct" | "group"
│       ├── participants: { userId: true, ... }
│       ├── lastMessage: string
│       ├── lastMessageTime: timestamp
│       └── unreadCount: { userId: number, ... }
│
└── notes/
    └── {userId}/
        └── {noteId}/
            ├── title: string
            ├── content: string
            ├── createdAt: timestamp
            ├── updatedAt: timestamp
            └── color: string
```

### 2.2 LocalStorage (Sincronização Offline)

```javascript
{
  "user": {
    "id": "user_123",
    "username": "João",
    "code": "JDKF92",
    "status": "online"
  },
  "friends": ["user_456", "user_789"],
  "groups": ["group_001", "group_002"],
  "messages": {
    "conv_123": [
      { id: "msg_1", senderId: "user_456", text: "Oi!", timestamp: 1234567890 }
    ]
  },
  "notes": [
    { id: "note_1", title: "Compras", content: "Leite, pão", color: "yellow" }
  ]
}
```

---

## 3. Fluxo de Utilizador

### 3.1 Primeiro Acesso

1. Utilizador abre a app
2. Se não tem `userId`, gera um novo (Firebase Anonymous)
3. Cria um `username` e recebe um `code` único (ex: `JDKF92`)
4. Dados salvos em LocalStorage e Firebase

### 3.2 Adicionar Amigos

1. Utilizador A clica em "Adicionar Amigo"
2. Insere o código do Utilizador B (ex: `JDKF92`)
3. Sistema verifica se o código existe em Firebase
4. Se sim, cria ligação bidirecional em `friends/`
5. Abre conversa direta com Utilizador B

### 3.3 Criar Grupo

1. Utilizador A clica em "Novo Grupo"
2. Insere nome do grupo e seleciona amigos para adicionar
3. Sistema cria entrada em `groups/` com `members` e `sharedLists`
4. Gera um `groupCode` para outros se juntarem (opcional)

### 3.4 Partilhar Lista com Grupo

1. Utilizador A seleciona uma lista (tema) existente
2. Clica em "Partilhar com Grupo"
3. Seleciona o grupo destino
4. Sistema adiciona `themeId` a `groups/{groupId}/sharedLists`
5. Todos os membros do grupo veem a lista em tempo real

### 3.5 Mensagens em Tempo Real

1. Utilizador A envia mensagem para Utilizador B
2. Mensagem é salva em `messages/{conversationId}/`
3. Firebase dispara evento em tempo real
4. Utilizador B recebe notificação se estiver online
5. Se offline, mensagem aparece quando volta online

---

## 4. Componentes da Nova Página

### 4.1 Layout Principal (`MessagesPage.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  Sidebar Esquerda         │  Área Central           │
├─────────────────────────────────────────────────────┤
│ • Amigos Online           │  Conversa Ativa         │
│ • Grupos                  │  (Mensagens)            │
│ • Notas Rápidas           │                         │
│ • Novo Amigo (+)          │  Input de Mensagem      │
│ • Novo Grupo (+)          │                         │
└─────────────────────────────────────────────────────┘
```

### 4.2 Componentes Necessários

1. **FriendsPanel** - Lista de amigos com status online/offline
2. **GroupsPanel** - Lista de grupos com membros
3. **ConversationView** - Área de chat com mensagens
4. **MessageInput** - Input para enviar mensagens
5. **QuickNotes** - Mini bloco de notas flutuante
6. **AddFriendModal** - Modal para adicionar amigo por código
7. **CreateGroupModal** - Modal para criar grupo
8. **SharedListsPanel** - Listas compartilhadas no grupo

### 4.3 Indicadores de Status

```
🟢 Online      - Utilizador está ativo agora
🟡 Ocupado     - Utilizador está ocupado (não quer ser incomodado)
⚫ Offline     - Utilizador está offline (não vê mensagens em tempo real)
⏰ Visto há X min - Último acesso (se offline há mais de 5 min)
```

---

## 5. Funcionalidades Principais

### 5.1 Mensagens Diretas

- Chat 1-a-1 com amigos
- Histórico de mensagens sincronizado
- Indicador de "digitando..."
- Marcação de mensagens como lidas
- Notificações de nova mensagem

### 5.2 Mensagens de Grupo

- Chat com múltiplos membros
- Cada membro vê quem está online
- Indicador de quantas pessoas leram a mensagem
- Menções com `@username`

### 5.3 Listas Compartilhadas

- Amigos/grupos podem editar a mesma lista em tempo real
- Sincronização automática de produtos adicionados/removidos
- Histórico de quem fez cada alteração
- Opção de "Lock" para evitar edições simultâneas

### 5.4 Mini Bloco de Notas

- Notas rápidas pessoais (não compartilhadas)
- Cores diferentes para categorizar
- Sincronização entre abas/dispositivos
- Busca por notas
- Opção de fixar notas importantes

---

## 6. Integração com Página Existente

### 6.1 Navegação

Adicionar abas ou menu na página principal:

```
[Lista de Produtos] [Mensagens] [Notas] [Amigos] [Grupos]
```

Ou um botão flutuante no canto inferior direito que abre um painel lateral.

### 6.2 Partilha de Temas

Modificar o botão "Partilhar Tema" para:

```
Partilhar Tema
├── Copiar Link (código do tema)
├── Enviar para Amigo (abre conversa)
└── Partilhar com Grupo (seleciona grupo)
```

### 6.3 Status Global

O `statusBadge` existente continua funcionando, mas agora:
- Sincroniza em tempo real com Firebase
- Outros utilizadores veem o seu status
- Muda automaticamente para "offline" se inativo por 5 minutos

---

## 7. Implementação Passo a Passo

### Fase 1: Setup Firebase

1. Criar projeto Firebase (gratuito)
2. Ativar Realtime Database
3. Configurar regras de segurança (ver secção 8)
4. Adicionar SDK Firebase ao projeto

### Fase 2: Autenticação e Utilizador

1. Criar hook `useAuth()` para gerir autenticação anónima
2. Gerar `userId` único e `code` de 6 caracteres
3. Sincronizar dados do utilizador com Firebase

### Fase 3: Amigos e Grupos

1. Implementar `addFriend()` com validação de código
2. Implementar `createGroup()` e `addMemberToGroup()`
3. Listar amigos e grupos com status em tempo real

### Fase 4: Mensagens

1. Implementar `sendMessage()` com timestamp
2. Implementar `listenToConversation()` para sincronização em tempo real
3. Criar UI de chat com histórico

### Fase 5: Notas e Integração

1. Implementar mini bloco de notas com CRUD
2. Integrar com página principal
3. Testar sincronização offline/online

---

## 8. Regras de Segurança Firebase

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid",
        "code": {
          ".read": true
        }
      }
    },
    "friends": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()",
        ".write": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()"
      }
    },
    "conversations": {
      "$conversationId": {
        ".read": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()",
        ".write": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()"
      }
    },
    "groups": {
      "$groupId": {
        ".read": "root.child('groups').child($groupId).child('members').child(auth.uid).exists()",
        ".write": "root.child('groups').child($groupId).child('members').child(auth.uid).exists()"
      }
    },
    "notes": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## 9. Próximos Passos

1. **Criar página `messages.html`** com a nova interface
2. **Integrar Firebase SDK** no projeto
3. **Implementar hooks de sincronização** (useFirebaseSync, useFriends, etc.)
4. **Testar fluxos offline/online**
5. **Publicar no GitHub Pages**

---

## 10. Notas Importantes

- **GitHub Pages é estático**: Não pode executar código no servidor. Por isso, usamos Firebase para toda a lógica em tempo real.
- **Segurança**: Firebase Anonymous é seguro para este caso de uso, mas os dados são públicos por código. Considere adicionar autenticação por email no futuro.
- **Limite de Dados**: Firebase Realtime Database tem limite de 100 conexões simultâneas no plano gratuito. Para mais, considere Supabase.
- **Sincronização Offline**: LocalStorage garante que a app funciona sem internet. Quando volta online, sincroniza automaticamente.

---

## Referências

- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [React + Firebase](https://www.freecodecamp.org/news/how-to-use-firebase-with-react/)

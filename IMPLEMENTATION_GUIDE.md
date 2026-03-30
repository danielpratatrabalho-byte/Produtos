# Guia de Implementação - Sistema de Colaboração

## 📋 Índice

1. [Configuração Firebase](#configuração-firebase)
2. [Estrutura de Ficheiros](#estrutura-de-ficheiros)
3. [Como Usar os Componentes](#como-usar-os-componentes)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Próximos Passos](#próximos-passos)

---

## 🔥 Configuração Firebase

### Passo 1: Criar Projeto Firebase

1. Aceda a [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar Projeto"
3. Insira o nome do projeto (ex: "Product List Collab")
4. Siga os passos de configuração

### Passo 2: Ativar Realtime Database

1. No painel esquerdo, clique em "Realtime Database"
2. Clique em "Criar Base de Dados"
3. Selecione a localização mais próxima (ex: `europe-west1`)
4. **Modo de Segurança**: Escolha "Iniciar em modo de teste" (para desenvolvimento)

### Passo 3: Obter Credenciais

1. Clique em "Configurações do Projeto" (ícone de engrenagem)
2. Vá para a aba "Geral"
3. Desça até "Seus apps" e clique em "Adicionar app"
4. Selecione "Web" (ícone `</>`)
5. Insira um nome (ex: "Product List Web")
6. Copie o bloco de configuração

### Passo 4: Adicionar Variáveis de Ambiente

1. Crie um ficheiro `.env.local` na raiz do projeto
2. Adicione as variáveis do Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=product-list-collab.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://product-list-collab.firebaseio.com
VITE_FIREBASE_PROJECT_ID=product-list-collab
VITE_FIREBASE_STORAGE_BUCKET=product-list-collab.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

---

## 📁 Estrutura de Ficheiros

```
client/src/
├── lib/
│   └── firebase.ts              # Funções Firebase (CRUD, listeners)
├── hooks/
│   └── useCollaboration.ts      # Hooks React para colaboração
├── pages/
│   ├── Home.tsx                 # Página principal (lista de produtos)
│   ├── Messages.tsx             # Página de mensagens e colaboração
│   └── NotFound.tsx
├── components/
│   └── ui/                      # Componentes shadcn/ui
└── App.tsx                      # Rotas e layout global
```

### Ficheiros Principais

#### `client/src/lib/firebase.ts`
Contém todas as operações Firebase:
- **Utilizadores**: `createUserProfile()`, `updateUserStatus()`, `getUserByCode()`
- **Amigos**: `addFriend()`, `removeFriend()`, `getFriends()`
- **Grupos**: `createGroup()`, `addMemberToGroup()`, `getGroupsForUser()`
- **Mensagens**: `sendMessage()`, `listenToMessages()`, `listenToConversations()`
- **Notas**: `createNote()`, `updateNote()`, `deleteNote()`, `listenToNotes()`

#### `client/src/hooks/useCollaboration.ts`
Hooks React que encapsulam a lógica Firebase:
- `useAuth()` - Autenticação anónima
- `useUserProfile()` - Perfil do utilizador
- `useUserStatus()` - Status online/offline/busy
- `useFriends()` - Gestão de amigos
- `useGroups()` - Gestão de grupos
- `useConversations()` - Conversas em tempo real
- `useMessages()` - Mensagens de uma conversa
- `useNotes()` - Notas rápidas

#### `client/src/pages/Messages.tsx`
Interface de colaboração com:
- Sidebar com amigos e grupos
- Área de chat com mensagens em tempo real
- Mini bloco de notas
- Modais para adicionar amigos e criar grupos

---

## 🎯 Como Usar os Componentes

### Exemplo 1: Adicionar a Página de Mensagens

Já está configurada em `App.tsx`:

```tsx
<Route path={"/messages"} component={Messages} />
```

Aceda em: `http://localhost:3000/messages`

### Exemplo 2: Usar Hooks num Componente

```tsx
import { useAuth, useFriends, useMessages } from '@/hooks/useCollaboration';

function MyComponent() {
  const { userId } = useAuth();
  const { friends, addNewFriend } = useFriends(userId);
  
  return (
    <div>
      <p>Amigos: {friends.length}</p>
      <button onClick={() => addNewFriend('user_123')}>
        Adicionar Amigo
      </button>
    </div>
  );
}
```

### Exemplo 3: Enviar Mensagem

```tsx
const { messages, sendNewMessage } = useMessages(conversationId);

const handleSend = async () => {
  await sendNewMessage(userId, 'Olá!');
};
```

### Exemplo 4: Criar Nota

```tsx
const { createNewNote } = useNotes(userId);

const handleCreateNote = async () => {
  await createNewNote('Título', 'Conteúdo', 'yellow');
};
```

---

## 🔄 Fluxo de Dados

### Fluxo de Autenticação

```
1. Utilizador abre a app
   ↓
2. useAuth() verifica localStorage
   ↓
3. Se não tem userId, cria autenticação anónima Firebase
   ↓
4. Guarda userId em localStorage
   ↓
5. useUserProfile() cria perfil com código único
```

### Fluxo de Mensagens

```
1. Utilizador A clica em Utilizador B
   ↓
2. Sistema cria/obtém conversationId
   ↓
3. useMessages() subscreve a `messages/{conversationId}`
   ↓
4. Firebase dispara evento em tempo real
   ↓
5. Mensagens aparecem na UI
   ↓
6. Utilizador A envia mensagem
   ↓
7. sendMessage() escreve em Firebase
   ↓
8. Utilizador B recebe em tempo real
```

### Fluxo de Amigos

```
1. Utilizador A clica "Adicionar Amigo"
   ↓
2. Insere código do Utilizador B (ex: JDKF92)
   ↓
3. getUserByCode() procura em Firebase
   ↓
4. Se encontrado, addFriend() cria relação bidirecional
   ↓
5. Ambos veem um ao outro na lista de amigos
```

---

## 🚀 Próximos Passos

### Fase 1: Testar Localmente

1. Instale dependências: `pnpm install`
2. Configure Firebase (ver secção acima)
3. Inicie dev server: `pnpm dev`
4. Abra `http://localhost:3000/messages`
5. Teste criar amigos, grupos e enviar mensagens

### Fase 2: Integrar com Página Existente

Adicione um botão na página de lista de produtos que leva a `/messages`:

```tsx
// Em Home.tsx ou na navbar
<Link href="/messages">
  <Button>💬 Mensagens</Button>
</Link>
```

### Fase 3: Partilhar Listas com Grupos

Modifique o botão "Partilhar Tema" para incluir opção de grupo:

```tsx
// Adicione em Home.tsx
const handleShareWithGroup = async (groupId: string, themeId: string) => {
  await shareListWithGroup(groupId, themeId);
};
```

### Fase 4: Sincronização Offline

Implemente sincronização automática quando volta online:

```tsx
useEffect(() => {
  window.addEventListener('online', () => {
    // Sincronizar dados com Firebase
  });
}, []);
```

### Fase 5: Publicar no GitHub Pages

1. Construa o projeto: `pnpm build`
2. Publique em GitHub Pages
3. Configure domínio customizado (opcional)

---

## 🔐 Regras de Segurança Firebase

Após testes, atualize as regras de segurança:

1. Vá para Firebase Console → Realtime Database → Regras
2. Substitua o conteúdo com:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid",
        "code": { ".read": true }
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

3. Clique em "Publicar"

---

## 📝 Notas Importantes

- **LocalStorage**: Dados são guardados localmente para funcionar offline
- **Firebase Realtime**: Sincronização automática quando online
- **Códigos de Amigos**: 6 caracteres aleatórios (ex: JDKF92)
- **Status**: Online, Offline, Busy (sincronizado em tempo real)
- **Mensagens**: Histórico completo guardado em Firebase

---

## 🆘 Troubleshooting

### Problema: "Cannot find module 'firebase'"
**Solução**: Execute `pnpm install firebase`

### Problema: Mensagens não aparecem
**Solução**: Verifique se Firebase está configurado corretamente em `.env.local`

### Problema: Amigos não aparecem
**Solução**: Certifique-se de que os códigos estão corretos (6 caracteres)

### Problema: Dados não sincronizam offline
**Solução**: Verifique se LocalStorage está ativado no navegador

---

## 📚 Recursos

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Última atualização**: Março 2026

# Player Window - Premium Feature Implementation

**Status:** MVP Completo (Visível para todos) | Pendente: Restrição por Tier

## Contexto

A janela secundária do player (controles + perfil) foi implementada como MVP e está visível para todos os usuários. No entanto, essa funcionalidade deveria ser exclusiva para usuários **Spotify Premium**, pois apenas eles podem controlar a reprodução via API.

---

## O que foi implementado (MVP)

✅ **Frontend:**

- `PlayerWindow.jsx` - Componente visual com controles e perfil
- `main.jsx` - Roteamento hash-based (`#/player`)
- Sincronização de tema entre janelas via IPC

✅ **Electron:**

- `createPlayerWindow()` - Criação da janela secundária
- Sincronização de posição/tamanho (8px abaixo da janela principal)
- Sincronização de estados (minimizar, restaurar, fechar)

✅ **IPC (Inter-Process Communication):**

- `preload.js` - Métodos `sendThemeChange` e `onThemeChange`
- `electron.js` - Handler para broadcast de tema

---

## O que precisa ser feito

### 1. Backend: Endpoint para verificar Tier do Spotify

**Arquivo:** `backend/main.py`

Criar endpoint que retorna se o usuário é Premium:

```python
@app.get('/spotify/user-tier')
async def get_user_tier():
    """
    Retorna o tier do usuário (premium ou free)
    """
    token = await db.get_spotify_token()
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("https://api.spotify.com/v1/me", headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Erro ao buscar dados do usuário")

    user_data = response.json()
    is_premium = user_data.get("product") == "premium"

    return {
        "tier": user_data.get("product"),  # "premium" ou "free"
        "is_premium": is_premium
    }
```

---

### 2. Frontend: API Client

**Arquivo:** `frontend/src/api/api.js`

Adicionar método no `spotifyAPI`:

```javascript
export const spotifyAPI = {
  // ... métodos existentes

  getUserTier: async () => {
    const response = await api.get("/spotify/user-tier");
    return response.data;
  },
};
```

---

### 3. Electron: Condicional para criar janela

**Arquivo:** `frontend/electron.js`

Modificar `createWindow()` para verificar tier antes de criar a janela do player:

```javascript
async function createWindow() {
  // ... código existente de criação da mainWindow

  mainWindow.once("ready-to-show", () => {
    console.log("[CodeQuest] Janela pronta, exibindo...");
    mainWindow.show();

    // Verificar tier antes de criar player window
    checkTierAndCreatePlayer();
  });
}

async function checkTierAndCreatePlayer() {
  try {
    // Aguardar um pouco para garantir que o backend está pronto
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch("http://127.0.0.1:8000/spotify/user-tier");
    const data = await response.json();

    if (data.is_premium) {
      console.log(
        "[CodeQuest] Usuário Premium detectado. Criando Player Window...",
      );
      createPlayerWindow();
    } else {
      console.log("[CodeQuest] Usuário Free. Player Window desabilitada.");
    }
  } catch (error) {
    console.error("[CodeQuest] Erro ao verificar tier:", error);
    // Em caso de erro, não criar a janela (fail-safe)
  }
}
```

**Nota:** O Electron precisa fazer uma requisição HTTP ao backend. Adicionar `node-fetch` se necessário:

```bash
npm install node-fetch
```

---

### 4. Tratamento de Erros

**Considerações:**

- Se o usuário não estiver autenticado no Spotify, não criar a janela.
- Se a API do Spotify estiver indisponível, não criar a janela (fail-safe).
- Adicionar logs claros para debug.

---

### 5. UX para Usuários Free (Opcional)

**Ideia:** Mostrar uma mensagem na janela principal informando que os controles de player são exclusivos para Premium.

**Implementação:**

- Adicionar um banner/tooltip no `App.jsx` quando `tier === "free"`.
- Exemplo: _"🎵 Controles de Player disponíveis apenas para Spotify Premium"_

---

## Checklist de Implementação

- [ ] Criar endpoint `/spotify/user-tier` no backend
- [ ] Adicionar `getUserTier()` no `api.js`
- [ ] Modificar `electron.js` para verificar tier antes de criar `playerWindow`
- [ ] Testar com conta Free
- [ ] Testar com conta Premium
- [ ] (Opcional) Adicionar mensagem UX para usuários Free

---

## Testes

### Cenário 1: Usuário Premium

1. Fazer login com conta Premium
2. Verificar que a janela do player abre automaticamente
3. Verificar que os controles funcionam

### Cenário 2: Usuário Free

1. Fazer login com conta Free
2. Verificar que a janela do player **NÃO** abre
3. (Opcional) Verificar mensagem informativa na UI

### Cenário 3: Sem autenticação

1. Não fazer login no Spotify
2. Verificar que a janela do player **NÃO** abre
3. Não deve haver erros no console

---

## Notas Técnicas

- A API do Spotify retorna `product: "premium"` ou `product: "free"` no endpoint `/v1/me`.
- A verificação deve ser feita **após** o backend estar pronto (aguardar 2-3 segundos).
- Se o usuário fizer upgrade para Premium, precisará reiniciar o app para ver a janela do player.

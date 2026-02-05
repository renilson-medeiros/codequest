# CodeQuest 🎮⚔️

> Transforme suas tarefas em uma aventura épica com gamificação e integração Spotify

CodeQuest é um gerenciador de tarefas gamificado que transforma sua produtividade em uma jornada de RPG. Complete missões (quests), ganhe XP, suba de nível e sincronize suas tarefas com suas músicas favoritas do Spotify.

![CodeQuest Banner](/frontend/public/preview.png)

---

## ✨ Características

- 🎯 **Sistema de Quests** - Organize tarefas como missões de RPG com checkpoints
- 🎵 **Integração Spotify** - Sincronize quests com playlists e controle a reprodução
- 💎 **Sistema de XP & Níveis** - Ganhe experiência ao completar tarefas
- 🎨 **Temas Personalizáveis** - 6 temas retrô/pixel art (Dourado, Roxo, Ciano, Verde, Rosa, Vermelho)
- 🖼️ **Perfil Customizável** - Avatar, estatísticas e progresso visual
- 🎮 **Design Retro/Pixel** - Interface inspirada em jogos clássicos
- 📊 **Modo Focus** - Visualização minimalista para concentração máxima
- 🪟 **Player Window** - Janela secundária com controles de música (Premium)

---

## 🛠️ Tecnologias

### Backend

- **Python 3.10+** - Linguagem principal
- **FastAPI** - Framework web assíncrono
- **Uvicorn** - Servidor ASGI
- **SQLite** - Banco de dados local
- **aiosqlite** - Driver assíncrono para SQLite
- **Spotify Web API** - Integração com Spotify

### Frontend

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **Electron** - Framework desktop multiplataforma
- **Tailwind CSS** - Framework CSS utilitário
- **Framer Motion** - Animações
- **Lucide React** - Ícones
- **Axios** - Cliente HTTP

### Ferramentas

- **Concurrently** - Execução paralela de processos
- **Wait-on** - Sincronização de inicialização

---

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.10+
- **Conta Spotify** (Premium para controles de reprodução)
- **Windows 10+** / macOS / Linux

---

## 🚀 Instalação e Uso

### 1. Clone o repositório

```bash
git clone https://github.com/renilson-medeiros/codequest.git
cd codequest
```

### 2. Configure o Backend

```bash
cd backend
pip install -r requirements.txt
```

Crie um arquivo `.env` em `backend/`:

```env
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/spotify/auth/callback
```

> **Como obter credenciais Spotify:**
>
> 1. Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
> 2. Crie um novo app
> 3. Copie Client ID e Client Secret
> 4. Adicione `http://localhost:8000/spotify/auth/callback` em Redirect URIs

### 3. Configure o Frontend

```bash
cd ../frontend
npm install
```

### 4. Execute o Aplicativo

```bash
npm start
```

Isso iniciará:

- Backend Python em `http://127.0.0.1:8000`
- Frontend Vite em `http://localhost:5173`
- Aplicação Electron desktop

---

## 🎮 Como Usar

1. **Login Spotify** - Faça login na primeira execução
2. **Criar Quest** - Clique no `+` para criar uma nova missão
3. **Adicionar Checkpoints** - Divida a quest em etapas menores
4. **Sincronizar Música** - Vincule uma playlist do Spotify à quest
5. **Completar Tarefas** - Marque checkpoints como concluídos e ganhe XP
6. **Modo Focus** - Ative para visualização minimalista durante trabalho

---

## 📁 Estrutura do Projeto

```
codequest/
├── backend/              # API Python/FastAPI
│   ├── main.py          # Endpoints e lógica principal
│   ├── database.py      # Gerenciamento SQLite
│   └── requirements.txt # Dependências Python
├── frontend/            # Aplicação Electron/React
│   ├── src/            # Código-fonte React
│   ├── electron.js     # Processo principal Electron
│   ├── preload.js      # Script de preload
│   └── package.json    # Dependências Node
└── doc/                # Documentação (gitignored)
```

---

## 🎨 Sistema de XP

- **+5 XP** por checkpoint completado
- **+25 XP** por quest completada
- **Leveling dinâmico** - Cada nível requer +25 XP a mais que o anterior
  - Nível 1→2: 50 XP
  - Nível 2→3: 75 XP
  - Nível 3→4: 100 XP

---

## 🔮 Roadmap

- [ ] Restrição de Player Window para usuários Premium
- [ ] Sistema de conquistas (achievements)
- [ ] Temas desbloqueáveis por nível
- [ ] Companions animados (pets pixel art)
- [ ] Estatísticas e gráficos de produtividade
- [ ] Sincronização em nuvem
- [ ] Versão mobile

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

**Renilson Medeiros**

- GitHub: [@renilson-medeiros](https://github.com/renilson-medeiros)

---

## 🙏 Agradecimentos

- Design inspirado em jogos clássicos de RPG
- Comunidade Spotify Developers
- Electron e React communities

---

<div align="center">
  
**Transforme tarefas em aventuras. Comece sua jornada hoje! ⚔️**

</div>

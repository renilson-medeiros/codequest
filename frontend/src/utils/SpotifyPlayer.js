let internalPlayer = null;
let lastDeviceId = null;
let isConnecting = false;

export const initSpotifyPlayer = (token, onReady, onStateChange) => {
  if (internalPlayer && lastDeviceId) {
    console.log('CodeQuest: [SDK] Player já carregado. Reutilizando ID:', lastDeviceId);
    onReady(lastDeviceId);
    return Promise.resolve(internalPlayer);
  }

  if (isConnecting) {
    console.log('CodeQuest: [SDK] Aguardando conexão em andamento...');
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (internalPlayer && lastDeviceId) {
          clearInterval(checkInterval);
          onReady(lastDeviceId);
          resolve(internalPlayer);
        }
      }, 500);
    });
  }

  isConnecting = true;

  return new Promise((resolve, reject) => {
    const setupPlayer = () => {
      if (internalPlayer) {
        console.log('CodeQuest: [SDK] Setup detectou player já iniciado.');
        isConnecting = false;
        if (lastDeviceId) onReady(lastDeviceId);
        resolve(internalPlayer);
        return;
      }

      console.log('CodeQuest: [SDK] Criando instância Spotify.Player...');
      const player = new window.Spotify.Player({
        name: 'CodeQuest Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      player.on('ready', ({ device_id }) => {
        console.log('CodeQuest: [SDK] Evento READY recebido! Device ID:', device_id);
        lastDeviceId = device_id;
        onReady(device_id);
      });

      player.on('not_ready', ({ device_id }) => {
        console.warn('CodeQuest: [SDK] Evento NOT_READY!', device_id);
        lastDeviceId = null;
      });

      player.on('player_state_changed', (state) => {
        if (state) {
          console.log('CodeQuest: [SDK] Mudança de estado detectada.');
          onStateChange(state);
        }
      });

      player.on('initialization_error', ({ message }) => { 
        console.error('CodeQuest: [SDK] Erro Inicialização:', message);
        isConnecting = false;
        reject(message);
      });
      
      player.on('authentication_error', ({ message }) => { 
        console.error('CodeQuest: [SDK] Erro Autenticação:', message);
        isConnecting = false;
        reject(message);
      });
      
      player.on('account_error', ({ message }) => { 
        console.error('CodeQuest: [SDK] Erro Conta (Premium?):', message);
        isConnecting = false;
        reject(message);
      });

      player.connect().then(success => {
        if (success) {
          console.log('CodeQuest: [SDK] Connect retornou SUCESSO!');
          internalPlayer = player;
          isConnecting = false;
          resolve(player);
        } else {
          console.error('CodeQuest: [SDK] Connect retornou FALHA.');
          isConnecting = false;
          reject('Connection failed');
        }
      }).catch(err => {
        console.error('CodeQuest: [SDK] Exceção no connect():', err);
        isConnecting = false;
        reject(err);
      });
    };

    if (window.Spotify && window.Spotify.Player) {
      console.log('CodeQuest: [SDK] Objeto window.Spotify já existe.');
      setupPlayer();
    } else {
      console.log('CodeQuest: [SDK] window.Spotify não encontrado. Registrando onSpotifyWebPlaybackSDKReady...');
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('CodeQuest: [SDK] onSpotifyWebPlaybackSDKReady disparado!');
        setupPlayer();
      };
    }
  });
};

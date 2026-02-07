import spotipy
from spotipy.oauth2 import SpotifyOAuth
from typing import Optional, Dict
import os
from dotenv import load_dotenv
import logging

# Variaveis
load_dotenv()
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8000/spotify/auth/callback")


# Scopes 
SCOPES = [
    "user-read-currently-playing",  
    "user-read-playback-state",      
    "playlist-modify-public",        
    "playlist-modify-private",
    "user-modify-playback-state",
    "streaming",
    "user-read-email",
    "user-read-private"
]

class SpotifyService:
    # Gerenciar a conexao com o spotify
    
    def __init__(self):
        self.sp_oauth = None
        self.sp = None
        self._initialize_oauth()
    
    def _initialize_oauth(self):

        if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
            return
        
        try:
            self.sp_oauth = SpotifyOAuth(
                client_id=SPOTIFY_CLIENT_ID,
                client_secret=SPOTIFY_CLIENT_SECRET,
                redirect_uri=SPOTIFY_REDIRECT_URI,
                scope=" ".join(SCOPES),
                cache_path=".spotify_cache",
                show_dialog=True
            )
            logging.info("Spotify OAuth inicializado com sucesso!")

        except Exception as e:
            logging.info(f"Erro ao inicializar Spotify OAuth: {e}")
    
    def get_auth_url(self) -> str:

        if not self.sp_oauth:
            raise Exception(
                "OAuth não inicializado. Verifique se as credenciais "
                "SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET estão no arquivo .env"
            )
        
        return self.sp_oauth.get_authorize_url()
    
    def authenticate_with_code(self, code: str) -> bool:

        if not self.sp_oauth:
            return False
        
        try:
            token_info = self.sp_oauth.get_access_token(code)
            self.sp = spotipy.Spotify(auth=token_info['access_token'])
            logging.info("Autenticação Spotify concluída!")

            return True
        except Exception as e:
            logging.info(f"Erro na autenticação: {e}")
            return False
    
    def transfer_playback(self, device_id: str):
        if self.sp:
            try:
                self.sp.transfer_playback(device_id, force_play=True)
                return True
            except Exception as e:
                logging.info(f"Erro ao transferir playback: {e}")
                return False
        return False

    def get_access_token(self) -> Optional[str]:
        if not self.sp_oauth:
            return None
        token_info = self.sp_oauth.get_cached_token()
        if token_info:
            return token_info['access_token']
        return None

    def is_authenticated(self) -> bool:
        
        if not self.sp_oauth:
            return False
        
        # Tentar pegar token do cache
        token_info = self.sp_oauth.get_cached_token()
        
        if token_info:
            self.sp = spotipy.Spotify(auth=token_info['access_token'])
            return True
        
        return False
    
    def get_current_track(self) -> Optional[Dict]:

        if not self.sp:
            return None
        
        try:
            current = self.sp.current_playback()
            
            if not current or not current.get('item'):
                return None
            
            track = current['item']
            
            return {
                "track_name": track['name'],
                "artist": ", ".join([artist['name'] for artist in track['artists']]),
                "album": track['album']['name'],
                "album_art": track['album']['images'][0]['url'] if track['album']['images'] else None,
                "spotify_uri": track['uri'],
                "duration_ms": track['duration_ms'],
                "progress_ms": current.get('progress_ms', 0),
                "is_playing": current['is_playing']
            }
        
        except Exception as e:
            logging.info(f"Erro ao buscar música atual: {e}")
            return None
    
    def play(self):
        if self.sp:
            try:
                self.sp.start_playback()
                return True
            except Exception as e:
                logging.info(f"Erro ao dar play: {e}")
                return False
        return False

    def pause(self):
        if self.sp:
            try:
                self.sp.pause_playback()
                return True
            except Exception as e:
                logging.info(f"Erro ao pausar: {e}")
                return False
        return False

    def next_track(self):
        if self.sp:
            try:
                self.sp.next_track()
                return True
            except Exception as e:
                logging.info(f"Erro ao pular: {e}")
                return False
        return False

    def previous_track(self):
        if self.sp:
            try:
                self.sp.previous_track()
                return True
            except Exception as e:
                logging.info(f"Erro ao voltar: {e}")
                return False
        return False
    
    def set_volume(self, volume_percent: int):
        if self.sp:
            try:
                self.sp.volume(volume_percent)
                return True
            except Exception as e:
                logging.info(f"Erro ao ajustar volume: {e}")
                return False
        return False
    
    def create_playlist(self, name: str, track_uris: list) -> Optional[str]:

        if not self.sp:
            return None
        
        try:
            # Pegar ID do usuário
            user = self.sp.current_user()
            user_id = user['id']
            
            # Criar playlist
            playlist = self.sp.user_playlist_create(
                user=user_id,
                name=name,
                public=False, 
                description="Criada pelo CodeQuest"
            )
            
            # Adicionar músicas (max 100 por vez)
            if track_uris:
                # Spotipy aceita no máximo 100 
                for i in range(0, len(track_uris), 100):
                    batch = track_uris[i:i+100]
                    self.sp.playlist_add_items(playlist['id'], batch)
            
            logging.info(f"Playlist '{name}' criada com sucesso!")
            return playlist['external_urls']['spotify']
        
        except Exception as e:
            logging.info(f"Erro ao criar playlist: {e}")
            return None
    
    def get_user_info(self) -> Optional[Dict]:

        if not self.sp:
            return None
        
        try:
            user = self.sp.current_user()
            return {
                "display_name": user.get('display_name', 'Usuário'),
                "email": user.get('email'),
                "profile_url": user.get('external_urls', {}).get('spotify'),
                "image": user.get('images', [{}])[0].get('url') if user.get('images') else None
            }
        except Exception as e:
            logging.info(f"Erro ao buscar info do usuário: {e}")
            return None
    
    def logout(self):
        self.sp = None
        # Remove cache file if exists
        try:
            if os.path.exists(".spotify_cache"):
                os.remove(".spotify_cache")
                logging.info("Cache do Spotify removido.")
        except Exception as e:
            logging.error(f"Erro ao remover cache do Spotify: {e}")
            


# Criar uma instância única do serviço
spotify_service = SpotifyService()


def get_spotify_service() -> SpotifyService:
    return spotify_service


def format_track_info(track_data: Dict) -> str:

    if not track_data:
        return "Nenhuma música tocando"
    
    status = "Tocando" if track_data.get('is_playing') else "Pausado"

    return f"{status}: {track_data['track_name']} - {track_data['artist']}"
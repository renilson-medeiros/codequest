from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from spotify_service import get_spotify_service
from models import PlaylistCreate

router = APIRouter(prefix = "/spotify", tags = ["Spotify"])

spotify = get_spotify_service()

# Auth
@router.get("/auth/login")
async def spotify_login():
    try:
        auth_url = spotify.get_auth_url()

        return {
            "auth_url": auth_url,
            "message": "Url para autorizar CodeQuest com Spotify"
        }

    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    
# Callback
@router.get("/auth/callback")
async def spotify_callback(code: str = None, error: str = None):

    if error:
        raise HTTPException(
            status_code = 400, 
            detail = f"Erro na autenticação: {error}"
        )
    
    if not code:
        raise HTTPException(
            status_code = 400, 
            detail = "Código de autorização não fornecido"
        )
    
    # Autenticar
    sucess = spotify.authenticate_with_code(code)

    if not sucess:
        raise HTTPException(
            status_code = 400, 
            detail = "Falha ao autenticar com Spotify"
        )
    
    return {
        "message": "Autenticação com Spotify bem-sucedida! Pode fechar esta página",
    }

# Verifica se o user esta autenticado
@router.get("/auth/status")
async def check_auth_status():
    is_auth = spotify.is_authenticated()

    if is_auth:
        user_info = spotify.get_user_info()

        return {
            "authenticated": True,
            "user": user_info
        }
    
    return {
        "authenticated": False,
        "message": "Usuário não autenticado"
    }

# Logout
@router.post("/auth/logout")
async def spotify_logout():
    spotify.logout()
    return {"message": "Desconectado com sucesso"}

# Musica atual
@router.get("/current")
async def get_current_playing():

    if not spotify.is_authenticated():
        raise HTTPException(
            status_code = 401, 
            detail = "Usuário não autenticado"
        )
    
    track = spotify.get_current_track()

    if not track:
        return {
            "playing": False,
            "message": "Nenhuma música tocando no momento"
        }
    
    return {
        "playing": True,
        "track": track
        }

@router.post("/volume")
async def spotify_volume(volume: int):
    if not spotify.is_authenticated():
        raise HTTPException(status_code=401, detail="Não autenticado")
    success = spotify.set_volume(volume)
    return {"success": success}

@router.post("/transfer-playback")
async def transfer_playback(device_id: str):
    if not spotify.is_authenticated():
        raise HTTPException(status_code=401, detail="Não autenticado")
    success = spotify.transfer_playback(device_id)
    return {"success": success}

@router.get("/user-tier")
async def get_user_tier():
    if not spotify.is_authenticated():
        return {"is_premium": False}
    try:
        user = spotify.sp.current_user()
        return {"is_premium": user.get('product') == 'premium'}
    except:
        return {"is_premium": False}

@router.get("/access-token")
async def get_access_token():
    token = spotify.get_access_token()
    return {"access_token": token}

# Playback Controls
@router.post("/play")
async def spotify_play():
    if not spotify.is_authenticated():
        raise HTTPException(status_code=401, detail="Não autenticado")
    success = spotify.play()
    return {"success": success}

@router.post("/pause")
async def spotify_pause():
    if not spotify.is_authenticated():
        raise HTTPException(status_code=401, detail="Não autenticado")
    success = spotify.pause()
    return {"success": success}

@router.post("/next")
async def spotify_next():
    if not spotify.is_authenticated():
        raise HTTPException(status_code=401, detail="Não autenticado")
    success = spotify.next_track()
    return {"success": success}

@router.post("/previous")
async def spotify_previous():
    if not spotify.is_authenticated():
        raise HTTPException(status_code=401, detail="Não autenticado")
    success = spotify.previous_track()
    return {"success": success}

# Criar playlist
@router.post("/create-playlist")
async def create_playlist_from_quest(
    request: PlaylistCreate
):
    
    if not spotify.is_authenticated():
        raise HTTPException(
            status_code = 401, 
            detail = "Usuário não autenticado"
        )
    
    if not request.track_uris:
        raise HTTPException(
            status_code = 400, 
            detail = "Lista de músicas vazia"
        )
    
    playlist_url = spotify.create_playlist(request.playlist_name, request.track_uris)

    if not playlist_url:
        raise HTTPException(
            status_code = 500, 
            detail = "Falha ao criar playlist"
        )
    
    return {
        "message": "Playlist criada com sucesso!",
        "playlist_url": playlist_url,
        "total_tracks": len(request.track_uris)
    }


    
















    
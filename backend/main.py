from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
from datetime import datetime
from models import (
    QuestCreate,
    Quest,
    QuestWithCheckpoints,
    QuestSummary,
    CheckpointCreate,
    Checkpoint, 
    QuestUpdate,
    CheckpointUpdate,
    MusicSession,
    MusicTrackRequest,
    PlaylistCreate
)
from spotify_endpoints import router as spotify_router
import database as db
import logging

# Configurações
@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    logging.info("CodeQuest API rodando!")

    yield
    logging.info("CodeQuest API parado!")

# Inicializar app
app = FastAPI(
    title="CodeQuest API",
    description="API para gerenciar tarefas com integração Spotify",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spotify_router)

# Endpoints Root
@app.get("/")
# Endpoint de teste
async def root():
    return {
        "message": "CodeQuest API está rodando!",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "quests": "/quests",
            "health": "/health"
        }
    }

@app.get("/health")
# Verificar se a API está ok
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat()
    }

# ================
# Endpoint QUESTS

# Cria nova quest
@app.post("/quests", response_model = Quest, status_code = 201)
async def create_quest(quest: QuestCreate):
    quest_id = await db.create_quest(quest.title, quest.description)
    created_quest = await db.get_quest(quest_id)
    
    if not created_quest:
        raise HTTPException(status_code=500, detail="Error retrieving created quest")
        
    return created_quest

# Retornar todas as quest
@app.get("/quests", response_model = List[Quest])
async def get_all_quests():
    quests = await db.get_all_quests()

    return quests

# Retornar quest especifica
@app.get("/quests/{quest_id}", response_model = QuestWithCheckpoints)
async def get_quest_details(quest_id: int):
    quest = await db.get_quest(quest_id)

    if not quest:
        raise HTTPException(
            status_code = 404,
            detail = "Quest não encontrada"
        )
    
    checkpoints = await db.get_checkpoints_by_quest(quest_id)

    return {
        "quest": quest,
        "checkpoints": checkpoints
    }

# Ativar/Desativar sync de uma quest
@app.post("/quests/{quest_id}/sync", response_model = Quest)
async def update_quest_sync(quest_id: int, is_syncing: bool):
    quest = await db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest não encontrada")
        
    await db.update_quest_sync(quest_id, is_syncing)
    updated_quest = await db.get_quest(quest_id)
    return updated_quest

# Retorna estatisticas
@app.get("/quests/{quest_id}/stats", response_model = dict)
async def get_quest_stats(quest_id: int):
    quest = await db.get_quest(quest_id)

    if not quest:
        raise HTTPException(
            status_code = 404,
            detail = "Quest não encontrada"
        )
    
    stats = await db.get_quest_stats(quest_id)

    return {
        "quest": quest,
        **stats
    }

# Atualizar dados básicos da quest (título/descrição)
@app.patch("/quests/{quest_id}", response_model=Quest)
async def update_quest(quest_id: int, quest_update: QuestUpdate):
    quest = await db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest não encontrada")
    
    await db.update_quest(quest_id, quest_update.title, quest_update.description)
    return await db.get_quest(quest_id)

# Adicionar checkpoint a uma quest existente
@app.post("/checkpoints", response_model=Checkpoint)
async def create_new_checkpoint(checkpoint: CheckpointCreate, quest_id: int):
    quest = await db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest não encontrada")
    
    checkpoint_id = await db.create_checkpoint(quest_id, checkpoint.title, checkpoint.order_index)
    return await db.get_checkpoint(checkpoint_id)

# Atualizar um checkpoint (título/ordem)
@app.patch("/checkpoints/{checkpoint_id}", response_model=Checkpoint)
async def update_checkpoint(checkpoint_id: int, checkpoint_update: CheckpointUpdate):
    checkpoint = await db.get_checkpoint(checkpoint_id)
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint não encontrado")
    
    await db.update_checkpoint(checkpoint_id, checkpoint_update.title, checkpoint_update.order_index)
    return await db.get_checkpoint(checkpoint_id)

# Deletar um checkpoint
@app.delete("/checkpoints/{checkpoint_id}")
async def delete_checkpoint(checkpoint_id: int):
    checkpoint = await db.get_checkpoint(checkpoint_id)
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint não encontrado")
    
    await db.delete_checkpoint(checkpoint_id)
    return {"message": "Checkpoint deletado com sucesso"}

# Atualiza status da quest
@app.patch('/quests/{quest_id}/status')
async def update_quest_status(quest_id: int, status: str):
    valid_statuses = ["active", "paused", "completed"]

    if status not in valid_statuses:
        raise HTTPException(
            status_code = 400,
            detail = f"Status inválido. Use: {', '.join(valid_statuses)}"
        )
    
    quest = await db.get_quest(quest_id)

    if not quest:
        raise HTTPException(
            status_code = 404,
            detail = "Quest não encontrada"
        )
    
    await db.update_quest_status(quest_id, status)

    # Se completou, dar XP
    print(f">>> UPDATE STATUS: Checking completion. Status={status}")
    if status == "completed":
        print(f">>> QUEST COMPLETED! Awarding XP...")
        await db.add_xp(25)
        await db.increment_quests_completed()
        print(f">>> XP AWARDED and COUNT INCREMENTED")

    return {"message": "Status atualizado"}


# Deleta quest
@app.delete("/quests/{quest_id}")
async def delete_quest(quest_id: int):
    quest = await db.get_quest(quest_id)

    if not quest:
        raise HTTPException(
            status_code = 404,
            detail = "Quest não encontrada"
        )
    
    await db.delete_quest(quest_id)

    return {
        "message": "Quest deletada com sucesso!",
        "quest_id": quest_id
    }

# ================
# Endpoint CHECKPOINTS

# Cria novo checkpoint
@app.post("/quests/{quest_id}/checkpoints", status_code = 201)
async def create_checkpoint(quest_id: int, checkpoint: CheckpointCreate):
    quest = await db.get_quest(quest_id)

    if not quest:
        raise HTTPException(
            status_code = 404,
            detail = "Quest não encontrada"
        )

    checkpoint_id = await db.create_checkpoint(
        quest_id, 
        checkpoint.title, 
        checkpoint.order_index
    )

    return {
        "id": checkpoint_id,
        "message": "Checkpoint criado com sucesso!"
    }

# Marcar um checkpoint como compelto
@app.patch("/checkpoints/{checkpoint_id}/complete")
async def complete_checkpoint(checkpoint_id: int):
    checkpoint = await db.get_checkpoint(checkpoint_id)

    if not checkpoint:
        raise HTTPException(
            status_code = 404,
            detail = "Checkpoint não encontrado"
        )
    
    if checkpoint["completed"]:
        return {
            "message": "Checkpoint já está completo!",
            "checkpoint_id": checkpoint_id
        }
    
    await db.complete_checkpoint(checkpoint_id)
    
    # Award 5 XP per checkpoint
    await db.add_xp(5)

    return {
        "message": "Checkpoint completo!",
        "checkpoint_id": checkpoint_id,
        "completed_at": datetime.now().isoformat()    
    }

# Retornar todas as musicas tocadas
@app.get("/checkpoints/{checkpoint_id}/music")
async def get_checkpoint_music(checkpoint_id: int):
    checkpoint = await db.get_checkpoint(checkpoint_id)

    if not checkpoint:
        raise HTTPException(
            status_code = 404,
            detail = "Checkpoint não encontrado"
        )
    
    music_sessions = await db.get_music_by_checkpoint(checkpoint_id)

    return {
        "checkpoint": checkpoint,
        "music_sessions": music_sessions,
        "total_songs": len(music_sessions)
    }

# ================
# Endpoint MUSIC

# Registrar musica que esta tocando
@app.post("/music/track", status_code = 201)
async def track_music(request: MusicTrackRequest):
    checkpoint = await db.get_checkpoint(request.checkpoint_id)

    if not checkpoint:
        raise HTTPException(
            status_code = 404,
            detail = "Checkpoint não encontrado"
        )
    
    session_id = await db.create_music_session(
        request.checkpoint_id,
        request.track_name,
        request.artist,
        request.album or "",
        request.spotify_uri,
        request.duration_ms
    )

    return {
        "id": session_id,
        "message": f"Musica registrada: {request.track_name} - {request.artist}"
    }

# Retornar todas as musicas durante a quest
@app.get("/quests/{quest_id}/playlist")
async def get_quest_playlist(quest_id: int):
    quest = await db.get_quest(quest_id)

    if not quest:
        raise HTTPException(
            status_code = 404,
            detail = "Quest não encontrada"
        )
    
    music_sessions = await db.get_music_by_quest(quest_id)

    # Remover duplicada
    unique_tracks = {}

    for session in music_sessions:
        uri = session["spotify_uri"]

        if uri not in unique_tracks:
            unique_tracks[uri] = session

    return {
        "quest": quest,
        "total_songs_played": len(music_sessions),
        "unique_songs": len(unique_tracks),
        "playlist": list(unique_tracks.values())

    }

# Marcar loot como resgatado
@app.post("/quests/{quest_id}/retrieve_loot", response_model=Quest)
async def retrieve_quest_loot(quest_id: int):
    print(f">>> RETRIEVE_LOOT CHAMADO PARA QUEST {quest_id}")
    quest = await db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest não encontrada")
    
    await db.update_quest_loot_retrieved(quest_id, True)
    updated = await db.get_quest(quest_id)
    print(f">>> LOOT ATUALIZADO! loot_retrieved={updated.get('loot_retrieved')}")
    
    return updated

    return updated

@app.get("/user/stats")
async def get_user_stats():
    return await db.get_user_stats()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1", 
        port=8000,
        reload = True, 
    )

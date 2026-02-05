from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Tarefa principal
class QuestCreate(BaseModel):
    title: str
    description: Optional[str] = None

class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Quest(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    is_syncing: bool
    loot_retrieved: bool

    class Config:
        from_attributes = True
        
    @classmethod
    def model_validate(cls, obj):
        if isinstance(obj, dict):
            # Converter 0/1 para bool
            if 'is_syncing' in obj and isinstance(obj['is_syncing'], int):
                obj['is_syncing'] = bool(obj['is_syncing'])
            if 'loot_retrieved' in obj and isinstance(obj['loot_retrieved'], int):
                obj['loot_retrieved'] = bool(obj['loot_retrieved'])
        return super().model_validate(obj)

# Etapa da quest
class CheckpointCreate(BaseModel):
    title: str
    order_index: int

class CheckpointUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None

class Checkpoint(BaseModel):
    id: int
    quest_id: int
    title: str
    order_index: int
    completed: bool = False
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Musica tocada
class MusicSession(BaseModel):
    id: int
    checkpoint_id: int
    track_name: str
    artist: str
    album: str
    spotify_uri: str
    played_at: datetime
    duration_ms: int

    class Config:
        from_attributes = True

# Response para front
class QuestWithCheckpoints(BaseModel):
    quest: Quest
    checkpoints: List[Checkpoint]

class CheckpointWithMusic(BaseModel):
    checkpoint: Checkpoint
    music_sessions: List[MusicSession]

class QuestSummary(BaseModel):
    quest: Quest
    total_checkpoints: int
    completed_checkpoints: int
    progress_percentage: float
    total_time_minutes: Optional[float] = None
    total_songs_played: int

class MusicTrackRequest(BaseModel):
    checkpoint_id: int
    track_name: str
    artist: str
    album: Optional[str] = None
    spotify_uri: str
    duration_ms: int

class PlaylistCreate(BaseModel):
    playlist_name: str
    track_uris: List[str]
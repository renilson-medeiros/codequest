import sqlite3
import aiosqlite
import logging
from datetime import datetime
from typing import List, Optional
from models import Quest, Checkpoint, MusicSession

DATABASE_PATH = "codequest.db"

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Tabela QUESTS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            status TEXT DEFAULT 'active',
            is_syncing INTEGER DEFAULT 0,
            loot_retrieved INTEGER DEFAULT 0
        )
    """)

    # Migração: Adicionar coluna is_syncing se não existir
    try:
        cursor.execute("ALTER TABLE quests ADD COLUMN is_syncing INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass # Coluna já existe
    
    # Migração: Adicionar coluna loot_retrieved se não existir
    try:
        cursor.execute("ALTER TABLE quests ADD COLUMN loot_retrieved INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass # Coluna já existe
    
    # Tabela CHECKPOINTS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quest_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            completed BOOLEAN DEFAULT 0,
            completed_at TIMESTAMP,
            FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
        )
    """)
    
    # Tabela MUSIC_SESSIONS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS music_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            checkpoint_id INTEGER NOT NULL,
            track_name TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT,
            spotify_uri TEXT NOT NULL,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            duration_ms INTEGER,
            FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()
    logging.info("Database inicializado com sucesso!")

# ================
# QUESTS

# Criar uma nova quest e retornar seu ID
async def create_quest(title: str, description: Optional[str] = None) -> int:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO quests (title, description, status) VALUES (?, ?, ?)",
            (title, description, "active")
        
        )
        await db.commit()

        return cursor.lastrowid
    
# Obter uma quest pelo ID
async def get_quest(quest_id: int) -> Optional[Quest]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute(
            "SELECT * FROM quests WHERE id = ?",
            (quest_id,)
        )
        row = await cursor.fetchone()

        return dict(row) if row else None
    
# Listar todas as quests
async def get_all_quests() -> List[dict]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute("SELECT * FROM quests ORDER BY created_at DESC")
        rows = await cursor.fetchall()

        return [dict(row) for row in rows]
    
# Atualizar o status de uma quest
async def update_quest_status(quest_id: int, status: str) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        completed_at = datetime.now().isoformat() if status == "completed" else None
        await db.execute(
            "UPDATE quests SET status = ?, completed_at = ? WHERE id = ?",
            (status, completed_at, quest_id)
        )
        await db.commit()

        return True

# Atualizar o estado de sync de uma quest
async def update_quest_sync(quest_id: int, is_syncing: bool) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        sync_val = 1 if is_syncing else 0
        
        # Se estamos ativando o sync, desativamos todos os outros (apenas 1 sync por vez)
        if is_syncing:
            await db.execute("UPDATE quests SET is_syncing = 0")
            
        await db.execute(
            "UPDATE quests SET is_syncing = ? WHERE id = ?",
            (sync_val, quest_id)
        )
        await db.commit()
        return True

# Atualizar o estado de loot_retrieved de uma quest
async def update_quest_loot_retrieved(quest_id: int, retrieved: bool) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        val = 1 if retrieved else 0
        await db.execute(
            "UPDATE quests SET loot_retrieved = ? WHERE id = ?",
            (val, quest_id)
        )
        await db.commit()
        return True

# Deleta uma quest e seus checkpoints associados
async def delete_quest(quest_id: int) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "DELETE FROM quests WHERE id = ?",
            (quest_id,)
        )
        await db.commit()

        return True

# Atualizar uma quest (título/descrição)
async def update_quest(quest_id: int, title: str = None, description: str = None) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        if title is not None and description is not None:
            await db.execute("UPDATE quests SET title = ?, description = ? WHERE id = ?", (title, description, quest_id))
        elif title is not None:
            await db.execute("UPDATE quests SET title = ? WHERE id = ?", (title, quest_id))
        elif description is not None:
            await db.execute("UPDATE quests SET description = ? WHERE id = ?", (description, quest_id))
        await db.commit()
        return True

# ================
# CHECKPOINTS

# Criar novo checkpoint e retornar seu ID
async def create_checkpoint(quest_id: int, title: str, order_index: int) -> int:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO checkpoints (quest_id, title, order_index) VALUES (?, ?, ?)",
            (quest_id, title, order_index)
        )
        await db.commit()

        await db.commit()

        return cursor.lastrowid

# Atualizar um checkpoint
async def update_checkpoint(checkpoint_id: int, title: str = None, order_index: int = None) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        if title is not None and order_index is not None:
            await db.execute("UPDATE checkpoints SET title = ?, order_index = ? WHERE id = ?", (title, order_index, checkpoint_id))
        elif title is not None:
            await db.execute("UPDATE checkpoints SET title = ? WHERE id = ?", (title, checkpoint_id))
        elif order_index is not None:
            await db.execute("UPDATE checkpoints SET order_index = ? WHERE id = ?", (order_index, checkpoint_id))
        await db.commit()
        return True

# Deletar um checkpoint
async def delete_checkpoint(checkpoint_id: int) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("DELETE FROM checkpoints WHERE id = ?", (checkpoint_id,))
        await db.commit()
        return True

# Obter checkpoints de uma quest
async def get_checkpoints_by_quest(quest_id: int) -> List[dict]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute(
            "SELECT * FROM checkpoints WHERE quest_id = ? ORDER BY order_index",
            (quest_id,)
        )
        rows = await cursor.fetchall()
        
        return [dict(row) for row in rows]
    
# Checkpoint completo
async def complete_checkpoint(checkpoint_id: int) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "UPDATE checkpoints SET completed = 1, completed_at = ? WHERE id = ?",
            (datetime.now().isoformat(), checkpoint_id)
        )
        await db.commit()

        return True
    
# Busca checkpoint pelo ID
async def get_checkpoint(checkpoint_id: int) -> Optional[dict]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute(
            "SELECT * FROM checkpoints WHERE id = ?",
            (checkpoint_id,)
        )
        row = await cursor.fetchone()

        return dict(row) if row else None
    
# ================
# MUSIC SESSIONS

# Salva a musica tocada em um checkpoint
async def create_music_session(
        checkpoint_id: int,
        track_name: str,
        artist: str,
        album: str,
        spotify_uri: str,
        duration_ms: int
) -> int:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO music_sessions (checkpoint_id, track_name, artist, album, spotify_uri, duration_ms) VALUES (?, ?, ?, ?, ?, ?)",
            (checkpoint_id, track_name, artist, album, spotify_uri, duration_ms)
        )
        await db.commit()

        return cursor.lastrowid
    
# Obtem todas as musicas do checkpoint
async def get_music_by_checkpoint(checkpoint_id: int) -> List[dict]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute(
            "SELECT * FROM music_sessions WHERE checkpoint_id = ? ORDER BY played_at",
            (checkpoint_id,)
        )
        rows = await cursor.fetchall()

        return [dict(row) for row in rows]

# Obtem todas as musicas de uma quest
async def get_music_by_quest(quest_id: int) -> List[dict]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute(
            """SELECT m.* FROM music_sessions m
            JOIN checkpoints c ON m.checkpoint_id = c.id
            WHERE c.quest_id = ?
            ORDER BY m.played_at""",
            (quest_id,)
        )
        rows = await cursor.fetchall()

        return [dict(row) for row in rows]

# ================
# STATS

# Retorna estatísticas de uma quest
async def get_quest_stats(quest_id: int) -> dict:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = sqlite3.Row

        # Total de checkpoints
        cursor = await db.execute(
            "SELECT COUNT(*) as total FROM checkpoints WHERE quest_id = ?",
            (quest_id,)
        )
        total = (await cursor.fetchone())["total"]

        # Checkpoints completos
        cursor = await db.execute(
            "SELECT COUNT(*) as completed FROM checkpoints WHERE quest_id = ? AND completed = 1",
            (quest_id,)
        )
        completed = (await cursor.fetchone())["completed"]

        # Musicas tocadas
        cursor = await db.execute(
            """
            SELECT COUNT(*) as songs FROM music_sessions m
            JOIN checkpoints c ON m.checkpoint_id = c.id
            WHERE c.quest_id = ?
            """,
            (quest_id,)
        )
        songs = (await cursor.fetchone())["songs"]

        return {
            "total_checkpoints": total,
            "completed_checkpoints": completed,
            "progress_percentage": (completed / total * 100) if total > 0 else 0,
            "total_songs_played": songs
        }

# ================
# Inicializa o banco
if __name__ == "__main__":
    init_db()
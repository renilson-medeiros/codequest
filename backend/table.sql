-- quests
CREATE TABLE quests (
    id INT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    create_at TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT
)

-- checkpoints
CREATE TABLE checkpoints (
    id INT PRIMARY KEY,
    quest_id INT,
    title TEXT NOT NULL,
    order_index INT,
    completed BOOLEAN DEFAULT 0,
    completed_at TIMESTAMP,
    FOREIGN KEY (quest_id) REFERENCES quests(id)
)

-- music_sessions
CREATE TABLE music_sessions (
    id INT PRIMARY KEY,
    checkpoint_id INT,
    track_name TEXT,
    artist TEXT,
    album TEXT,
    spotify_uri TEXT,
    played_at TIMESTAMP,
    duration_ms INT,
    FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
)
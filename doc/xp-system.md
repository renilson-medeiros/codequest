# CodeQuest XP & Leveling System Documentation

This document outlines the current Experience Points (XP) system mechanics and the roadmap for future gamification features.

## 1. Current System Mechanics

### XP Sources

The system is designed to reward both incremental progress and major milestones:

- **Checkpoints (Stages):** **+5 XP** per checkpoint completed.
  - _Philosophy:_ Encourages breaking down tasks into smaller steps and rewards immediate progress.
- **Quest Completion:** **+25 XP** upon finishing all checkpoints and marking the quest as complete.
  - _Philosophy:_ A larger reward for crossing the finish line of a project/task.

- _Total Potential XP per Quest:_ `(Number of Checkpoints * 5) + 25`

### Leveling Formula

The leveling curve is dynamic, becoming progressively harder as the user levels up.

- **Starting Level:** 1
- **Base XP Requirement (Level 1 -> 2):** 50 XP
- **Scaling:** Each new level requires **+25 XP** more than the previous one.
  - Level 1 to 2: 50 XP
  - Level 2 to 3: 75 XP
  - Level 3 to 4: 100 XP
  - ...

### Data Persistence

- User stats are stored in the `user_stats` table in the local SQLite database (`codequest.db`).
- Columns: `level`, `xp`, `xp_to_next_level`, `quests_completed`, `total_songs_played`.

---

## 2. Future Features & Rewards Roadmap

Ideas for gamification elements to keep the "Adventure" feeling alive:

### 🎨 Cosmetic Rewards (Themes)

Unlockable themes based on Level or Quest milestones:

- [ ] **Gradient Themes:** Unlock cyberpunk/vaporwave gradients at Level 5, 10, 15.
- [ ] **OLED Black Mode:** A purely black theme for high-level users.
- [ ] **Seasonal Themes:** Unlockable content during holidays (e.g., Halloween Orange/Purple).

### 🧙‍♂️ Avatar Customization

- [ ] **Border Styles:** Gold, Diamond, or glowing animated borders for the avatar at elite levels.
- [ ] **Frames:** Pixel-art frames (retro computer monitor, fantasy shield) around the user photo.
- [ ] **Title Badges:** Titles like "Bug Hunter", "Code Wizard", "Night Owl" displayed under the name.

### 🐾 Companions (Animations)

- [ ] **Desktop Pet:** A small pixel-art animal (cat, dragon, robot) that sleeps on the quest card and wakes up when a checkpoint is marked.
- [ ] **Walking Animation:** The pet could walk across the XP bar as it fills up.

### 🎵 Audio Rewards

- [ ] **Level Up Sound:** A custom 8-bit fanfare when leveling up.
- [ ] **Loot Sound:** A coin/chest opening sound when retrieving a playlist.

---

## 3. Technical Notes

- **Backend:** `add_xp` function in `database.py` handles the leveling logic.
- **Frontend:** `UserProfileModal.jsx` displays the data, refreshing automatically on profile open.

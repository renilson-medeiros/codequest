# Secondary Player Window Implementation Plan

**Branch:** `feature/player-window`

## Goal

Create a secondary "child" window that stays anchored 8px below the main application window. This window will display User Profile info and Player Controls, maintaining the existing Retro/Pixel aesthetic.

## User Review Required

> [!NOTE]
> For the MVP, the player buttons will be visible for all users. Functionality might be limited for non-premium users depending on the Spotify API response.

## Proposed Changes

### Frontend Components

#### [NEW] [PlayerWindow.jsx](file:///c:/Users/renil/Documents/DEV/codequest/frontend/src/PlayerWindow.jsx)

- A new root-level component for the secondary window.
- **Layout:**
  - **Left:** User Avatar (small) + XP bar/text.
  - **Right:** Retro Player Controls (Play, Pause, Next, Prev).
- **Styling:** Uses existing `index.css`, `pixel-text`, and theme variables.
- **State:** Needs to fetch/receive User Stats and Player State (conceptually). For MVP, it might fetch its own stats or receive via IPC (fetching is easier for now).

#### [MODIFY] [main.jsx](file:///c:/Users/renil/Documents/DEV/codequest/frontend/src/main.jsx)

- Add simple hash-based routing.
- Check `window.location.hash`.
- If `hash === '#/player'`, render `<PlayerWindow />`.
- Else, render `<App />`.

### Electron Backend

#### [MODIFY] [electron.js](file:///c:/Users/renil/Documents/DEV/codequest/frontend/electron.js)

- **New Function:** `createPlayerWindow()`
  - Layout: `height: 120`, `frame: false`, `resizable: false` (or strict sync).
  - Loads URL with `#/player`.
- **Window Sync Logic:**
  - Listen for `mainWindow` events: `move`, `resize`, `minimize`, `restore`, `closed`.
  - `updatePlayerWindowPosition()`:
    - Get `mainWindow` bounds (`x, y, width, height`).
    - Set `playerWindow` bounds to:
      - `x`: `mainWindow.x`
      - `y`: `mainWindow.y + mainWindow.height + 8` (8px gap)
      - `width`: `mainWindow.width`
      - `height`: Fixed (e.g., 100px or 120px)

## Verification Plan

### Manual Verification

1.  Run `npm start`.
2.  Verify **two** windows open.
3.  **Move** the main window -> Confirm player window follows immediately.
4.  **Resize** the main window -> Confirm player window width updates.
5.  **Minimize** main window -> Confirm player window minimizes (or hides).
6.  **Check UI:** Confirm Player Window has the correct Retro/Pixel styling and layout (Avatar Left, Controls Right).

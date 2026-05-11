# Wasteland co-op guide

## What was added

`survival_game_multiplayer.html` is a copy of your prototype with a simple 2-player browser co-op mode.

- `HOST CO-OP` creates a room ID.
- `JOIN` connects to a friend's room ID.
- `Your nickname` sets the name shown above your character.
- Each player has separate resources, inventory, hotbar, consumables, and crafted tools.
- The host browser owns the world simulation.
- The second player sends movement and actions to the host.
- Solo still works without hosting a room.

## Free GitHub Pages setup

1. Create a public GitHub repository.
2. Upload `survival_game_multiplayer.html`.
3. Optional: rename it to `index.html` so the game opens at the site root.
4. Open repository `Settings -> Pages`.
5. Set `Source` to `Deploy from a branch`.
6. Select your branch, usually `main`, and `/ (root)`, then save.
7. Open the published URL. It will look like `https://YOUR_NAME.github.io/REPO_NAME/`.

## How to play together

1. Both players open the same GitHub Pages URL.
2. Both players type their nicknames.
3. Player 1 clicks `HOST CO-OP`.
4. Player 1 copies the generated ID and sends it to Player 2.
5. Player 2 pastes the ID and clicks `JOIN`.
6. Player 1 clicks `SURVIVE`.

## Important limitation

GitHub Pages only hosts static files. It does not run a multiplayer game server.

This prototype uses WebRTC through the free public PeerJS signal server. That means no paid hosting and no white IP are needed for the usual case, but some strict networks can still fail to connect. If you see `peer-unavailable`, both players should refresh, create a new host ID, and try again.

For a stronger version later, use a small authoritative server on a free tier host, or add a TURN relay. That is more reliable, but it is no longer just GitHub Pages.

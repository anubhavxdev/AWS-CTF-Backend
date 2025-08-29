# AWS CTF Discord Bot Documentation

## Overview
This Discord bot integrates with your AWS CTF backend to automate event management, participant support, and notifications for your Discord server.

---

## Setup
1. **Install dependencies:**
   ```bash
   cd discord-bot
   npm install
   ```
2. **Configure environment variables:**
   - Edit `.env`:
     - `DISCORD_TOKEN=your_discord_bot_token`
     - `BACKEND_API_URL=http://localhost:4000` (or your deployed backend URL)
3. **Start the bot:**
   ```bash
   npm start
   ```

---

## Features & Commands

### User Commands
- `!register` — Get the registration link.
- `!link <your registration email>` — Link your Discord account to your registration (enables role assignment and DMs).
- `!status <email>` — Get your registration/payment/team status.
- `!team <team name>` — Get info about a team.
- `!payment <email>` — Get your payment status.
- `!jointeam <team name> <your email>` — Request to join a team (for solo participants).
- `!help` — List all available commands.

### Admin/Organizer Commands (require Discord admin permissions)
- `!announce <message>` — Send an announcement to the #announcements channel.
- `!listteams` — List all registered teams.

### Automation Features
- **Auto-role assignment:**
  - When a user links their Discord and registration, the bot assigns them a role (Solo, Leader, Member) based on backend data.
- **DM notifications:**
  - When registration closes, all linked users receive a DM alert.
  - (Extendable: DM users on payment or join request updates.)
- **Polling:**
  - The bot polls the backend for registration status and team/member updates every few minutes.

---

## Integration Notes
- The backend should support endpoints for:
  - Linking Discord ID to user (`POST /api/auth/link-discord`)
  - Team/member info (`GET /api/admin/teams`)
  - Registration status (`GET /api/admin/registration-status`)
  - Payment status (`GET /api/payments/status`)
- For production, secure admin endpoints and use webhooks for real-time updates.
- Users must use `!link <email>` to enable automations and role assignment.

---

## Example Usage
- A user joins Discord, types `!register` to get the registration link.
- After registering, they type `!link their@email.com` to link their Discord.
- The bot assigns them the correct role and can DM them event updates.
- Admins can use `!announce` and `!listteams` for event management.

---

## Extending the Bot
- Add more commands for join request approval, payment reminders, or event schedules.
- Integrate with backend webhooks for instant notifications.
- Add logging and error reporting for better monitoring.

---

## Contact
For bot issues or feature requests, contact the backend/bot development team.

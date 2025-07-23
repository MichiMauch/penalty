# Prügelpause ⚔️

Ein rundenbasiertes Kampfspiel, bei dem zwei Spieler ihre Angriffe und Verteidigungen strategisch planen müssen.

## Features

- 🎮 Rundenbasiertes Gameplay mit 5 Angriffen und 5 Verteidigungen pro Phase
- 📧 Email-Einladungen für Herausforderungen
- 🎨 Animierte Kampf-Replays mit SVG-Figuren
- 📱 Mobile-responsive Design
- 🔗 Teilen via WhatsApp, Slack oder Link
- ⚡ Echtzeitmatches über Turso-Datenbank

## Spielregeln

### Angriffe & Verteidigungen
- **👊 Schlag** → wird gestoppt von **🛡️ Block**
- **🦵 Tritt** → wird gestoppt von **🦘 Springen**
- **💥 Kopfstoß** → wird gestoppt von **💨 Ausweichen**

### Spielablauf
1. **Phase 1**: Spieler A greift an (5 Schläge), Spieler B verteidigt (5 Abwehren)
2. **Phase 2**: Spieler B greift an (5 Schläge), Spieler A verteidigt (5 Abwehren)
3. Jeder erfolgreiche Treffer gibt 1 Punkt
4. Der Spieler mit den meisten Punkten gewinnt

## Setup

### Prerequisites
- Node.js 18+
- Turso Account (für Datenbank)
- Resend Account (für Email-Versand) - optional

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pruegelpause.git
cd pruegelpause
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local`:
```env
# Turso Database (Required)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Resend Email Service (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# App URL (for production)
NEXT_PUBLIC_APP_URL=https://pruegelpause.mauch.ai
```

### Database Setup

1. Create a Turso database:
```bash
turso db create pruegelpause
turso db show pruegelpause --url
turso db tokens create pruegelpause
```

2. The app will automatically create the required tables on first run.

### Email Setup (Resend) - Optional

Email functionality will work without configuration, but users will need to share links manually.

To enable automatic email invitations:

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (e.g., pruegelpause.mauch.ai)
3. Create an API key
4. Add the API key to your `.env.local`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `TURSO_DATABASE_URL` (required)
   - `TURSO_AUTH_TOKEN` (required)
   - `RESEND_API_KEY` (optional, for email)
   - `NEXT_PUBLIC_APP_URL` (set to your production URL)

4. Deploy!

### Domain Setup for Email

If using email functionality:
1. Add your domain in Resend dashboard
2. Configure DNS records as instructed by Resend:
   - SPF record
   - DKIM records
3. Verify domain ownership

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Database**: Turso (LibSQL)
- **Email**: Resend (optional)
- **Hosting**: Vercel
- **Animations**: CSS Keyframes, SVG

## Projektstruktur

```
├── app/
│   ├── api/match/          # API Routes für Match-Operationen
│   ├── game/[matchId]/     # Spielbereich
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Startseite
├── components/
│   ├── MoveSelectorWithInvite.tsx  # Züge-Auswahl mit Email
│   ├── GameResult.tsx              # Ergebnis-Anzeige
│   ├── AnimatedGameReplay.tsx      # Animierte Kampf-Wiederholung
│   └── FighterSVG.tsx              # SVG Kämpfer-Figuren
├── lib/
│   ├── db.ts              # Datenbank-Konfiguration
│   ├── gameLogic.ts       # Kampf-Engine
│   ├── email.ts           # Email-Service
│   ├── types.ts           # TypeScript-Typen
│   └── utils.ts           # Hilfsfunktionen
├── styles/
│   └── fighterAnimations.css  # CSS Animationen
└── ...
```

## License

MIT
# ClimateWatch ASEAN

A gamified climate action platform designed to inspire everyday people in the ASEAN region to take real environmental action through quests, a community feed, rankings, and an AI assistant.

Live site: [climate-watch-ecru.vercel.app](https://climate-watch-ecru.vercel.app/)

---

## What It Does

### 🟢 Quests
The core loop of ClimateWatch. Users are given AI-generated eco-friendly tasks tailored to their level (e.g. air-dry clothes, plant a tree, avoid single-use plastic). Each quest has one of three verification types:

- **Photo Required**: The user must upload a photo as proof of completion. Google Gemini analyzes the image and verifies whether the photo actually matches the quest. If it does not align, the quest is rejected with an explanation.
- **Photo Bonus**: The user can complete the quest on the honor system, or optionally submit a photo for AI verification and earn extra bonus points on top of the base reward.
- **Honor System**: Completed by self-report, no photo needed.

Completing quests earns points, increases your level, and advances your day streak.

### 🔥 Day Streak
Each day you complete at least one quest, your day streak counter increases. Your streak is visible on your profile and on the leaderboard next to your name.

### 🔵 Community Feed
A real-time social feed where users post updates about their climate actions. Other users can like posts. It works like a community board for sharing eco wins and motivating others.

### 🏆 Rankings
A global leaderboard ranking all users by total points earned. Your current rank and streak are displayed. The more quests you complete (and verify with photos), the higher you climb.

### 🌱 Growth Journey (Virtual Tree)
A visual representation of your environmental progress. Your virtual tree grows and evolves as you level up, making your cumulative climate impact visible and rewarding.

### 🤖 ClimaAi
An AI chatbot powered by Google Gemini 2.5 Flash. It answers climate-related questions, explains environmental issues, and gives eco advice tailored to the ASEAN region. It is limited to climate topics and responds in plain, simple language.

### 👤 Profile
Customize your display name and choose an avatar emoji. Your profile shows your current level, total points, global rank, and day streak.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7 |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas |
| AI | Google Gemini 2.5 Flash |
| Deployment | Vercel (frontend + serverless backend) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |

---

## Prerequisites

Make sure you have the following installed before running locally:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and cluster
- A [Google Gemini API key](https://ai.google.dev/) (paid tier recommended)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/KING-JAXXTY/climateWatch.git
cd climateWatch
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
cd ..
```

### 4. Configure environment variables

Create a file at `server/.env` (copy from `server/.env.example`):

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_key
GEMINI_API_KEY_PAID=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

### 5. Run the app

```bash
npm run dev
```

This starts both the frontend (Vite at `http://localhost:5173`) and the backend (Express at `http://localhost:5000`) concurrently.

---

## Project Structure

```
climateWatch/
├── src/                    # Frontend React source
│   ├── App.tsx             # Main app component and all page views
│   ├── App.css             # Main styles
│   ├── Auth.tsx            # Login and signup pages
│   ├── Auth.css
│   ├── AuthContext.tsx     # Auth state and API calls
│   ├── VirtualTree.tsx     # Growth Journey tree visualization
│   ├── VirtualTree.css
│   ├── passwordValidator.ts
│   └── main.tsx
├── server/
│   ├── server.js           # Express API server (all routes)
│   ├── .env                # Secrets — NOT committed to git
│   ├── .env.example        # Template for environment variables
│   └── package.json
├── public/
├── vercel.json             # Vercel deployment config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Deployment (Vercel)

The app is deployed on Vercel using:
- `@vercel/static-build` for the Vite frontend (`dist/`)
- `@vercel/node` for the Express backend as a serverless function

All `/api/*` requests are routed to `server/server.js` via `vercel.json`.

Set the following environment variables in the Vercel dashboard:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A strong random secret |
| `GEMINI_API_KEY_PAID` | Your Gemini API key |
| `VITE_API_URL` | `/api` |

---

## API Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/signup` | Register new account | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/user/profile` | Get current user profile | Yes |
| PUT | `/api/user/profile` | Update name and avatar | Yes |
| DELETE | `/api/user/account` | Delete account | Yes |
| POST | `/api/user/forgot-password` | Reset password | No |
| GET | `/api/quests` | Get user's quests | Yes |
| POST | `/api/quests` | Create a quest | Yes |
| PUT | `/api/quests/:id/complete` | Submit quest completion | Yes |
| DELETE | `/api/quests/:id` | Delete a quest | Yes |
| POST | `/api/quests/generate` | AI-generate quests | Yes |
| GET | `/api/feed` | Get community feed | Yes |
| POST | `/api/feed` | Post to feed | Yes |
| POST | `/api/feed/:id/like` | Like a post | Yes |
| GET | `/api/rankings` | Get leaderboard | Yes |
| POST | `/api/assistant` | Chat with ClimaAi | Yes |

---

## Security

- Passwords are hashed with bcryptjs (cost factor 12)
- All protected routes require a valid JWT in the `Authorization: Bearer <token>` header
- Real credentials are stored only in `server/.env` (gitignored) and Vercel environment variables — never in source code
- MongoDB Atlas is configured with IP access control

---

## The Developers

Built by students of **Mariano Marcos State University, Philippines** as a climate action initiative for the ASEAN region.

| Name | Role |
|---|---|
| Andrew Duldulao Caditan | Lead Developer |
| Camille Ira Dela Cruz | Developer |
| Hanni Marie Dadia | Developer |

---

## License

This project is for academic and educational purposes.


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

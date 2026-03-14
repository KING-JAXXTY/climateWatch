# 🔐 SECURITY SETUP GUIDE

## CRITICAL: Setup Environment Variables Before Running

Your project uses sensitive API keys and database credentials. **NEVER commit them to GitHub!**

### Step 1: Backend Setup (Server)

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in your actual credentials:
   ```bash
   # On Windows
   type .env
   
   # Then edit with your editor
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/...
   JWT_SECRET=generate_a_random_string_with_32_characters
   GEMINI_API_KEY=your_actual_gemini_api_key
   PORT=5000
   NODE_ENV=development
   ```

4. **NEVER DELETE** the `.env` file - it's for your local development

### Step 2: Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it into `.env` as `JWT_SECRET`

### Step 3: Get Your API Keys

- **Gemini API Key**: https://ai.google.dev/
- **MongoDB Connection**: MongoDB Atlas (https://www.mongodb.com/cloud/atlas)

### Security Checklist

✅ **What's now protected:**
- [x] `.env` files are in `.gitignore` (won't be committed)
- [x] Gemini API key moved from URL to secure headers
- [x] `.env.example` created as template (safe to commit)
- [x] `server/.gitignore` created to protect backend secrets

✅ **Always remember:**
- Never commit `.env` files
- Never share your API keys
- Rotate keys if they're accidentally exposed
- Use strong JWT secrets in production (32+ characters)
- Change `JWT_SECRET` from the default before production

### Files to Never Commit

```
server/.env              ← Contains real secrets
server/.env.local        ← Local overrides
.env                     ← Root .env file
.env.local              ← Local overrides
```

### Running the Server

```bash
cd server
npm install
npm run dev
```

The server will automatically load from `.env` using `dotenv.config()`

### Production Deployment

**NEVER hardcode secrets in production!** Use:
- Environment variables from your hosting platform
- Database credentials from secure vaults
- API keys from secret management services

Example for Vercel/Railway:
```
1. Go to your platform's settings
2. Add environment variables through the dashboard
3. Set: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
```

---

**Last Security Audit:** February 23, 2026

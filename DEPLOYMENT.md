# 🚀 Deploying Statify to Render

This guide will get your Statify PWA online in minutes.

## Prerequisites
- A [GitHub account](https://github.com/)
- A [Render account](https://render.com/)

---

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/statify.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Render

1. Go to [dashboard.render.com](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub and select your `statify` repo
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `statify` |
| Region | Singapore (or nearest) |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

5. Click **Create Web Service**

---

## Step 3: Wait & Access

1. Wait for build to complete (green ✅)
2. Your app will be at: `https://statify-xxxx.onrender.com`

---

## Step 4: Install on Mobile

### iOS
1. Open URL in Safari
2. Share → Add to Home Screen

### Android
1. Open URL in Chrome
2. Menu → Install App

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Render logs for error details |
| API errors | Ensure GROQ_API_KEY is working |
| Slow first load | Free tier spins down after 15 min inactivity |

---

## Environment Variables (Optional)

If you want to secure your API key, add this in Render:
- **Key**: `GROQ_API_KEY`
- **Value**: Your Groq API key

Then update `server.js` line 12:
```javascript
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'your-fallback-key';
```

🎉 **Done! Your Statify app is now live and installable!**

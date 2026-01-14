<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1h4aGneasGibQNtd7jXpQagsyw-WRy0Bg

## 🚀 Deployment (Vercel)

1.  **Framework Preset**: Vite
2.  **Environment Variables**:
    You MUST add the following environment variables in Vercel Project Settings for the app to work correctly:
    - `VITE_SUPABASE_URL`: (From your Supabase Project Settings)
    - `VITE_SUPABASE_ANON_KEY`: (From your Supabase Project Settings)
    - `GEMINI_API_KEY`: (Optional, for future AI features)

> [!IMPORTANT]
> If these variables are missing, the app will load in **Offline Mode** (showing only static data) and warn in the console, but it will not crash.

## 🛠 Tech Stack

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

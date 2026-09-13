# Arcanum Setup Guide

## Next Steps to Get Running

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and name it (e.g., "arcanum")
4. Set a strong database password (save it!)
5. Select a region close to you
6. Wait for project to provision (~2 minutes)

### 2. Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `docs/database-schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd+Enter)
6. You should see: "Success. No rows returned"

### 3. Create Storage Buckets

1. In Supabase, go to **Storage** (left sidebar)
2. Click **New bucket**
3. Create these three buckets:
   - Name: `sources` → Click **Create bucket**
   - Name: `map-overlays` → Click **Create bucket**
   - Name: `artifact-images` → Click **Create bucket**

4. Make each bucket public:
   - Click the bucket name
   - Click **Configuration** tab
   - Toggle **Public bucket** to ON
   - Click **Save**

### 4. Get API Credentials

1. In Supabase, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 5. Configure Environment

1. In your terminal, in the arcanum directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your values:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### 6. Run Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

You should see the project picker! Try creating a new project.

## Troubleshooting

### "Error loading projects"
- Check that your Supabase URL and key are correct in `.env`
- Make sure you ran the database schema SQL
- Check the browser console for detailed errors

### PDF won't render
- Check browser console for CORS errors
- Make sure the PDF is uploaded to the `sources` bucket
- Verify the bucket is set to public

### Map doesn't show
- Check browser console for errors
- MapLibre GL requires internet connection for tiles
- Make sure you're running on localhost (not file://)

## Push to GitHub

```bash
# Create a new repo on GitHub first, then:
git remote add origin https://github.com/yourusername/arcanum.git
git push -u origin main
```

## Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New...** → **Project**
3. Import your `arcanum` repository
4. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`: (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (your anon key)
6. Click **Deploy**

Your app will be live at `arcanum.vercel.app` (or your custom domain).

## What's Working Now

- ✅ Project creation and selection
- ✅ Map view with navigation
- ✅ Basic layout and dark theme
- ✅ Tab system (Map tab)

## What to Build Next

See the roadmap in `README.md`. Start with:
1. PDF upload functionality
2. Annotation drawing on PDFs
3. Linking annotations to map pins

Check out the `hunt-ide` folder for reference implementation of PDF annotations.

# Setup — from downloaded zip to a live, installable app

You'll get a zip of this whole folder. Here's the exact sequence to get it
into a real GitHub repo and live at a URL you can open on your phone.

## 1. Unzip it somewhere sensible

Pick a folder you'll keep long-term, e.g. `~/code/ib-academic-os`, and unzip
into it.

## 2. Create the GitHub repo (web UI, ~30 seconds)

1. Go to https://github.com/new
2. Repository name: `ib-academic-os` (or whatever you want)
3. Keep it **Public** (required for free GitHub Pages) or Private (works too,
   Pages is free either way now)
4. **Do NOT** check "Add a README" or "Add .gitignore" — this folder already
   has both, and GitHub will refuse the first push if they conflict
5. Click **Create repository** and leave the next page open — it shows the
   exact remote URL you'll need in step 3

## 3. Push it (terminal, run from inside the unzipped folder)

```bash
cd path/to/ib-academic-os
git init
git add .
git commit -m "Initial commit: Phase 1-5 MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ib-academic-os.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username — the exact URL is
shown on the page from step 2.

If this is the first time you're using git on this machine, it'll ask for
your name/email first:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 4. Turn on GitHub Pages (web UI)

1. On your repo page, go to **Settings → Pages**
2. Under "Build and deployment" → Source, choose **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Click **Save**

GitHub will give you a URL in the form
`https://YOUR-USERNAME.github.io/ib-academic-os/` — it takes a minute or two
to go live the first time.

## 5. Install it on your phone

Open that URL in your phone's browser (Chrome on Android, Safari on iOS) →
"Add to Home Screen" / the install prompt. It now runs like a real app,
works offline, and your data stays in the phone's browser storage.

## Every time you want to update the app later

```bash
git add .
git commit -m "describe what changed"
git push
```

GitHub Pages redeploys automatically within a minute or two.

## If you ever want a local preview before pushing

```bash
cd path/to/ib-academic-os
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

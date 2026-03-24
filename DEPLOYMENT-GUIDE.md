# Weekly Tactical — Deployment Guide
## Getting Your App Live on Vercel

This guide walks you through putting the Weekly Tactical app live on the internet using **GitHub** and **Vercel** — both free. No coding required. Estimated time: **30–45 minutes**.

---

## What You'll Need

- A computer with a web browser
- An email address
- The project files (the folder you received alongside this guide)

---

## Step 1: Create a GitHub Account

GitHub is where your app's code will be stored.

1. Go to **github.com**
2. Click **Sign up**
3. Enter your email, create a password, and choose a username
4. Verify your email address when prompted
5. On the welcome screen, you can skip all the optional steps

---

## Step 2: Create a New Repository on GitHub

A "repository" (or "repo") is just a folder on GitHub that stores your project.

1. Once logged in, click the **+** icon in the top-right corner
2. Select **New repository**
3. Name it: `weekly-tactical`
4. Leave it set to **Public** (required for the free Vercel plan)
5. Do **not** check any of the initialization options
6. Click **Create repository**

You'll land on an empty repository page. Keep this tab open.

---

## Step 3: Upload Your Project Files

1. On your empty repository page, click **uploading an existing file** (the link in the middle of the page)
2. Open the `weekly-tactical-app` folder on your computer
3. Select **all files and folders** inside it:
   - `src/` (folder)
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `.gitignore`
4. Drag them all into the GitHub upload area
5. Scroll down and click **Commit changes**

Your code is now on GitHub. ✅

---

## Step 4: Create a Vercel Account

Vercel is the service that will turn your GitHub code into a live website.

1. Go to **vercel.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub** — this connects the two accounts automatically
4. Authorize Vercel when prompted

---

## Step 5: Deploy Your App on Vercel

1. Once logged into Vercel, click **Add New Project**
2. You'll see your GitHub repositories listed — click **Import** next to `weekly-tactical`
3. On the configuration screen:
   - **Framework Preset:** Vite (Vercel may detect this automatically)
   - Leave everything else as default
4. Click **Deploy**

Vercel will build and deploy your app. This takes about 60 seconds.

---

## Step 6: Get Your Live URL

When the deployment is complete, Vercel will show a **Congratulations** screen with your live URL. It will look something like:

```
https://weekly-tactical-xxxx.vercel.app
```

Click it — your app is live! 🎉

---

## Step 7 (Optional): Set a Custom Domain

If you want a professional URL like `weeklytactical.com`:

1. Purchase a domain from a registrar like **Namecheap** or **Google Domains** (~$12/year)
2. In your Vercel project, go to **Settings → Domains**
3. Enter your domain name and follow the DNS instructions Vercel provides
4. Allow up to 24 hours for the domain to fully activate

---

## Making Future Updates

Whenever you want to update the app (new features, wording changes, etc.):

1. Come back to Claude and make the changes
2. Download the updated `App.jsx` file
3. Go to your GitHub repository
4. Navigate to `src/App.jsx`
5. Click the **pencil icon** (Edit) or drag in the new file to replace it
6. Click **Commit changes**

Vercel will automatically detect the change and redeploy your app within about 60 seconds.

---

## Troubleshooting

**"Build failed" on Vercel:**
Make sure all files were uploaded correctly to GitHub, including the `src/` folder with `main.jsx` and `App.jsx` inside it.

**App shows a blank page:**
Check that `index.html` is in the root of your repository (not inside any folder).

**"Repository not found" on Vercel:**
Make sure your GitHub repository is set to Public.

---

## Summary Checklist

- [ ] GitHub account created
- [ ] Repository named `weekly-tactical` created
- [ ] All project files uploaded to GitHub
- [ ] Vercel account created and connected to GitHub
- [ ] Project imported and deployed on Vercel
- [ ] Live URL confirmed and working
- [ ] (Optional) Custom domain connected

---

*Built with React + Vite · Deployed on Vercel*

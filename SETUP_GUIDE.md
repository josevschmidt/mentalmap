# MentalMap Setup Guide

Since this repository is public, you must follow these steps carefully to ensure your private keys are not exposed while making the application functional.

---

## 1. Supabase Project Setup

1.  **Create a Project**: Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Get Your Keys**:
    - Go to **Project Settings** > **API**.
    - Find your **Project URL** and `anon` **Public API Key**.
3.  **Local Secrets**:
    - In your local project folder, open (or create) a file named `.env.local`.
    - Add these lines (replace with your actual keys):
      ```bash
      VITE_SUPABASE_URL=https://your-project-id.supabase.co
      VITE_SUPABASE_ANON_KEY=your-long-anon-key
      ```
    - **Crucial**: `.env.local` is already in `.gitignore`, so these keys will **not** be pushed to GitHub.

---

## 2. Database Initialization

1.  In the Supabase dashboard, go to the **SQL Editor**.
2.  Click **New Query** and paste the following code, then click **Run**:

```sql
-- Create the table to store mind maps
create table user_maps (
  user_id uuid references auth.users not null primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security (RLS) so users can't see each other's data
alter table user_maps enable row level security;

-- Create a policy: "Users can only see/edit their own map"
create policy "Users can only access their own maps"
  on user_maps for all
  using (auth.uid() = user_id);

-- Enforce the 1MB limit on the database side
alter table user_maps add constraint data_length_check 
  check (octet_length(data::text) <= 1048576);
```

---

## 3. Google OAuth Setup (Auth)

To allow users to log in with Google, you need to link Google and Supabase.

### A. Google Cloud Console
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Go to **APIs & Services** > **OAuth consent screen**.
    - Choose **External** and fill in the required app names/emails.
4.  Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
    - **Application type**: Web application.
    - **Authorized redirect URIs**: You need a URI from Supabase.
      - Go to your **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
      - Copy the **Redirect URL** provided there (it looks like `https://xxx.supabase.co/auth/v1/callback`).
      - Paste this into the Google Cloud "Authorized redirect URIs" field.
5.  Click **Create** and you will get a **Client ID** and **Client Secret**.

### B. Supabase Auth Configuration
1.  Go back to **Supabase** > **Authentication** > **Providers** > **Google**.
2.  Enable the Google provider.
3.  Paste the **Client ID** and **Client Secret** you just got from Google.
4.  Click **Save**.

---

## 4. Deployment (GitHub Actions/Secrets)

If you are deploying this app to a service (like Vercel, Netlify, or GitHub Pages):

1.  **Do NOT** put `.env.local` on GitHub.
2.  Instead, go to your deployment platform's settings (e.g., **GitHub Repository** > **Settings** > **Secrets and variables** > **Actions**).
3.  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **Repository Secrets**.
4.  If you are using Vite, these will be injected during the build process automatically.

---

## Summary of Private vs. Public
- **Public**: Your code, your `.gitignore`, and the `SETUP_GUIDE.md`.
- **Private (Local)**: The `.env.local` file.
- **Private (Cloud)**: The secret variables in your deployment dashboard (Vercel/GitHub Secrets).

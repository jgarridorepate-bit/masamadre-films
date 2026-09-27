# Masamadre Films website: setup guide

This folder is the complete website plus a project editor at `/admin`.
You do these steps **once**, in about 15-20 minutes. After that you only use the editor.

What you need: a GitHub account (free) and a Netlify account (free).
You can sign up to Netlify with your GitHub account, which saves a step.

---

## 1. Put the site on GitHub

1. Create an account at https://github.com if you don't have one.
2. Click **New repository** (the **+** at the top right).
   - Repository name: `masamadre-films`
   - Choose **Private** (recommended) or Public. Both work.
   - Click **Create repository**.
3. On the empty repository page, click **uploading an existing file**.
4. Unzip this folder on your computer. Select **everything inside it** (`index.html`, `admin`, `content`, `img`, `netlify.toml`, this guide) and drag it into the browser window.
5. Click **Commit changes**.

## 2. Tell the editor which repository to use (one line)

1. In your repository on GitHub, open `admin/config.yml`.
2. Click the pencil icon (Edit).
3. On line 6, replace `TU-USUARIO-DE-GITHUB` with your GitHub username. Example:
   `repo: juangarrido/masamadre-films`
4. Click **Commit changes**.

## 3. Publish the site on Netlify

1. Go to https://app.netlify.com and log in with GitHub.
2. **Add new project** (or "Add new site") > **Import an existing project** > **GitHub**.
3. Authorise Netlify and pick the `masamadre-films` repository.
4. Leave the build settings empty (there is no build step) and click **Deploy**.
5. After about 30 seconds the site is live at an address like `something.netlify.app`.

## 4. Let the editor log in with GitHub

This connects the editor's "Log in with GitHub" button to your account.

**4a. Create a GitHub "OAuth App"**
1. Go to https://github.com/settings/developers > **OAuth Apps** > **New OAuth App**.
2. Fill in:
   - Application name: `Masamadre editor`
   - Homepage URL: your Netlify address (for example `https://something.netlify.app`)
   - Authorization callback URL: `https://api.netlify.com/auth/done` (exactly this)
3. Click **Register application**.
4. Copy the **Client ID**. Click **Generate a new client secret** and copy the secret too
   (GitHub only shows it once).

**4b. Paste them into Netlify**
1. In Netlify, open your project > **Project configuration** > **Security** (or "Access & security") > **OAuth**.
2. Under **Authentication providers**, click **Install provider** > **GitHub**.
3. Paste the Client ID and Client Secret and save.

## 5. Use the editor

Go to `https://your-address/admin/` and click **Iniciar sesión con GitHub**.

- **Add a project:** "Add proyecto" at the top of the list, fill in the form, then **Publicar**.
- **Edit:** click the arrow next to a project to open it.
- **Remove:** the **x** on the right of a project. To hide one without deleting it, switch off **Visible en la web**.
- **Reorder:** drag the **=** handle. The first project is the first one shown on the site.
- **Images:** "Elige una imagen" uploads a still from your computer. Use horizontal images at least 1600 px wide.

After **Publicar**, the site updates in about a minute. If you don't see the change, reload the page.

## 6. Your own domain (optional)

In Netlify: **Domain management** > **Add a domain** > `masamadrefilms.com`, then follow the instructions
for the DNS settings at the company where you bought the domain. Netlify adds HTTPS automatically.

After the domain works, update the **Homepage URL** of the GitHub OAuth App (step 4a) to the new address.

## Other people editing

Anyone who should use the editor needs a GitHub account and to be added as a collaborator:
repository on GitHub > **Settings** > **Collaborators** > **Add people**.

## If something goes wrong

- **The editor says it can't find the repository:** check the `repo:` line in `admin/config.yml` (step 2). It must be exactly `username/repository-name`.
- **The login window closes with an error:** check the callback URL in the GitHub OAuth App is exactly `https://api.netlify.com/auth/done`, and that the provider is installed in Netlify (step 4b).
- **A change doesn't appear:** open Netlify > **Deploys** to see whether the last update finished.

## What is where (for reference)

- `index.html`: the website.
- `content/projects.json`: the projects. The editor writes this file; you never need to open it.
- `img/`: images. New uploads from the editor go to `img/uploads/`.
- `admin/`: the editor.

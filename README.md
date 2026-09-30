# TidyHavens 2 — Admin editor for Netlify

This version adds Decap CMS at `/admin/` with GitHub-backed editing, image
uploads, reorderable text/image/product sections, draft review, and publishing.
It includes the two existing articles, their original URLs, the existing images,
and basic homepage/logo controls.

## Current status

- Website generation and content-editing configuration are implemented.
- The production build and integration checks pass locally.
- No GitHub repository or Netlify project has been selected or changed.
- Live login, draft saves and publishing must be verified after connecting your
  real repository and configuring OAuth. The admin shows a setup message rather
  than pretending to save if no repository is configured.
- This is a structured content editor, not a freeform page-layout designer.

## What changes when the site is live?

Content follows this path: admin editor → GitHub commit → Netlify build → website.
Saving a draft creates a CMS branch and pull request. Publishing merges it into
the configured production branch. Netlify then builds the published website.
The current live website stays available while a new deployment is building.
A failed build does not replace the last successful deployment.

For design/code changes, use a separate Git branch and pull request. Review the
Netlify Deploy Preview before merging. Revert a commit and push the reversal to
restore older code while preserving the change history. Code changes made by an
assistant require that assistant to have access to this same GitHub repository;
a Netlify URL alone does not grant editing access.

## Netlify setup

Use Git-based continuous deployment, not a manual upload, for daily CMS editing.

1. Put the source files in your intended GitHub repository. Use a private repo if
   you want repository contents and draft branches restricted to collaborators.
2. Import it into Netlify, or link it to the intended existing Netlify project.
3. Use these build settings (also supplied in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node: 22
4. Configure these non-secret build environment values in Netlify:
   - `CMS_GITHUB_REPO`: your exact `owner/repository`.
     The build can also infer it from Netlify's GitHub `REPOSITORY_URL`.
   - `CMS_BRANCH`: production branch, normally `main`.
5. Configure GitHub OAuth as described below, then deploy.
6. Open `https://YOUR-SITE/admin/`, sign in with the GitHub account with write
   permission to the chosen repository, and create a test draft.
7. Publish it, wait for the successful Netlify deployment, and verify its URL.
   Remove that test post when done.

Never put a personal access token, client secret, or password in source files,
admin configuration, or the browser. No such credentials are included here.
GitHub repository permissions enforce who can save; a hidden admin URL alone is
not an access control. Decap's GitHub backend requires repository push access.

## One-time GitHub sign-in setup

Use Netlify's OAuth provider service with Decap's direct GitHub backend.

1. In GitHub Settings → Developer settings → OAuth Apps, register an application.
2. Use your site's public URL as Homepage URL.
3. Use `https://api.netlify.com/auth/done` as the Authorization callback URL.
4. In the correct Netlify project, open Project configuration → Security → OAuth.
5. Under Authentication Providers, select Install Provider → GitHub, and enter
   the OAuth Client ID and Client Secret there. Keep the secret out of Git.
6. Allow popups for your site when signing in to `/admin/`.

This setup does not use Netlify Git Gateway, which is deprecated for new setups.
Keep GitHub branch-protection rules compatible with your intended CMS publishing
flow. If merges require another reviewer, Decap publication must satisfy that gate.
Draft branch Deploy Previews can be accessible to people with their preview URLs;
configure Netlify access controls if drafts need confidentiality.

## Daily editing

See `EDITOR-GUIDE.md` for the nontechnical workflow.
Use the Posts collection to create and edit posts. Add Text section, Image or
Product blocks and reorder them. The visual text editor supports formatted text,
lists, headings and links. The image fields use the media library for uploads.
Basic homepage changes are under Homepage & branding.

Use Save Draft for work in progress. Set its status to Ready and use Publish when
finished. The exact labels follow Decap's workflow controls. A change becomes
public only after a successful Netlify production deployment.
The "Show on website" toggle allows you to unpublish a post without deleting its
source. Toggle it off and publish that change. Changing an existing title keeps
its existing JSON filename and URL. Do not rename filenames after sharing links.
The Article date is a displayed date and sort order; it is not a scheduling tool.

## Local editor (optional)

Requires Node 22+ and npm. From the project root:

```bash
npm ci
npm run dev
```

Open `http://localhost:8080/admin/`. The local editor writes to source files on
this computer. GitHub authentication and editorial workflow are bypassed ONLY on
localhost; local mode uses direct local saves. It does not publish online.
The local proxy binds only to loopback and accepts only the local editor origin.
Do not expose this development server publicly. Close it with Ctrl+C.
The website rebuilds after a local content or upload change. Refresh the visitor
page to see the result. Local changes still need to be committed and pushed to
publish to your connected Netlify site.

## Source files

- `content/posts/*.json`: editable post data; filename determines the URL.
- `content/settings.json`: editable basic homepage and branding fields.
- `public/uploads/`: new image uploads, versioned in Git.
- `public/assets/`: original images and logo.
- `public/admin/`: admin startup and custom previews.
- `public/style.css`: visitor styles.
- `templates/`: shared page structures.
- `scripts/`: build and local server.
- `dist/`: generated deploy output; do not edit it directly.

The build regenerates post routes and the homepage blog list automatically. The
homepage shows the six most recent visible articles; `/blog/` lists all visible
articles. Source content is not copied into the public output. Use sensibly sized
web images; the editor stores original uploads in Git and does not compress them.

## Verification

```bash
npm test
npm run build
```

The integration checks exercise create/edit/hide/delete, uploaded-media output,
stable post routes, safe content rendering, and a fail-closed unconfigured admin.
Live OAuth/GitHub/Netlify integration requires the real accounts and has not yet
been tested. Browser visual QA has not been completed in this environment.

## Git history included with the ZIP

`source-history.bundle` contains the existing website history, the Netlify export
commit, and this admin version. The admin version is on `feature/admin-panel`.
Restore it into a new working folder with:

```bash
git clone -b feature/admin-panel source-history.bundle tidyhavens-admin
cd tidyhavens-admin
git branch -M main
git remote remove origin
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Use an empty destination repository for these commands. For an existing repo,
integrate on a branch rather than overwriting its history. The archive also
contains the current source files if you prefer a normal repository upload.

## Official documentation

- https://decapcms.org/docs/github-backend/
- https://decapcms.org/docs/editorial-workflows/
- https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/
- https://docs.netlify.com/manage/projects/add-new-project/

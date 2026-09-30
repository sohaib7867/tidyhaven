# Your daily posting guide

After your GitHub sign-in and Netlify connection are active, open your website
address followed by `/admin/` and sign in with your authorized GitHub account.

## Create a post

1. Open **Blog posts**, then create a new post.
2. Enter a clear title, category, date and short description.
3. Upload or select the cover image and describe it for readers who cannot see it.
4. Add article sections. Choose **Text section**, **Image**, or **Product**.
5. Format your text with the visual editor. Add headings and lists where useful.
6. For a Product section, add its name, image, description and full product link.
7. Use the section handles to reorder the article.
8. Turn on **Show affiliate disclosure** when the post contains affiliate links.
9. Check the preview and save a draft.
10. When ready, publish through the workflow controls and wait for Netlify to
    finish the deployment. Open the published article before linking your Pin.

A draft stays in a separate Git branch. Publishing sends the approved content to
the production branch. Future dates do not automatically schedule publication.

## Change an existing post

Open it in Blog posts, make your edits, preview, and publish the update. Its URL
stays the same when you edit the title. Publishing is not instantaneous: Netlify
needs to complete its build first.

To remove a post from the public website but keep its content, switch **Show on
website** off and publish the change. The article URL will then return a not-found
page. Only delete the post if you no longer need its source.

## Change the homepage

Open **Homepage & branding**. You can edit the main headline and introduction,
upload a new hero image, replace the logo, and update the Pinterest profile link.
Your layout and styles stay consistent. Full layout redesigns are code changes.

## Images

Use the media library's upload controls to add files. Drag and drop is supported
by the editor's upload interface where available. Add descriptive alternative
text. Keep image files reasonably small for mobile readers. Uploads are stored
with the website's Git history, so avoid deleting images still used in articles.

## Recover a mistake

Ask for the relevant Git commit to be reverted. This keeps a record of the mistake
and the correction. If a Netlify build fails, check its build log; the last
successful website remains live until a new deployment succeeds.

## Setup message instead of a login?

The editor is waiting for the real GitHub repository and Netlify sign-in setup.
That step must be completed before it can save posts online. This package does
not include credentials or a shared default password.

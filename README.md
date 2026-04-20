# INDR EV Deployment Notes

This is a fully static frontend application for INDR EV.

## Deployment Options

Since this project contains only static assets (HTML, CSS, JS, images, etc.), it can be deployed on any static hosting provider.

### GitHub Pages (Recommended)
1. Push this project to GitHub.
2. Go to the repository settings.
3. Under "Pages", configure the branch and folder (root folder) to be deployed.
4. Your website will be live. Add a custom domain if necessary.

### Vercel / Netlify
1. Log in to Vercel or Netlify.
2. Select "Add New Project" and import your GitHub repository.
3. Keep default settings (no build command is required).
4. Deploy the project. Wait for it to build and check the live URL.

## Architecture Guidelines
- **Fully Static**: The website doesn’t rely on any backend components. All content is managed directly within the frontend.
- **No Environment Variables**: No secrets, auth tokens, or session variables are required.
- **Contact Forms**: As the website has no backend, the submission of forms directly interfaces via standard mailto links or external third party tools instead of an internal backend API.

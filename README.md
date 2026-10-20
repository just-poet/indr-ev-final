# INDR EV Deployment Notes

This is a fully static frontend application for INDR EV.

## Deployment Options

Since this project contains only static assets (HTML, CSS, JS, images, etc.), it can be deployed on any static hosting provider.

### GitHub Pages (Recommended)
Push to `main` to publish through `.github/workflows/pages.yml`. The repository's
Pages source is GitHub Actions. No build step is required.

Live site: https://just-poet.github.io/indr-ev-final/

## Editing And Preview

Page content lives in the templates in `index.html`; hash routing and calculators
live in `app.js`. The active responsive stylesheet is `site.css`. The original
`styles.css` is retained as a reference and is no longer loaded.

The Partners page is available at `#partners`. Update its navigation link,
template and the homepage logo strip together when adding partners.

## Partner Brand Sources

The partner list was supplied by INDR EV. Descriptions summarise the brands'
public information without implying charger availability at every outlet.

- IndianOil: https://iocl.com/ and https://iocl.com/corporate-logo
- IndianOil logo: https://commons.wikimedia.org/wiki/File:Indian_Oil_Logo.svg
- SUB91: https://sub91.in/
- Barista: https://www.barista.co.in/
- The Chocolate Room: https://www.thechocolateroomindia.com/
- Evara Spa & Resort, Ramnagar: https://evararesort.com/

Logos are stored in `assets/partners/` and retain their original brand colours.
The IndianOil logo is sourced from Wikimedia Commons; the other logos come from
the brands' own websites. All brand names and logos belong to their respective
owners.

### Vercel / Netlify
1. Log in to Vercel or Netlify.
2. Select "Add New Project" and import your GitHub repository.
3. Keep default settings (no build command is required).
4. Deploy the project. Wait for it to build and check the live URL.

## Architecture Guidelines
- **Fully Static**: The website doesn’t rely on any backend components. All content is managed directly within the frontend.
- **No Environment Variables**: No secrets, auth tokens, or session variables are required.
- **Contact Forms**: As the website has no backend, the submission of forms directly interfaces via standard mailto links or external third party tools instead of an internal backend API.

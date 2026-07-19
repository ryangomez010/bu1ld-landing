# Security review — landing pass

## Fixed locally on The Bu1LD

1. **Atomic application submission (phase33)**  
   Applications and required answers now go through `submit_project_application`. Direct authenticated inserts into `project_applications` and `project_application_answers` are revoked.
2. **Anonymous project detail privacy**  
   Unauthenticated fetches use public catalog columns only.
3. **SEO/robots hygiene**  
   Auth and private member routes noindex / robots-disallowed; login/signup use `privatePageHead`.
4. **No committed project-specific Wrangler public keys**  
   Retained from Pass One.

## Still external

- Live schema/RLS proof for phase33
- OAuth/email/deletion credentialed smoke
- Cloudflare production headers verification after deploy

## Other sites

- FinanceMeta / VertexED: not security-patched this pass due to dirty concurrent trees.
- Obscured Records static site: WordPress API settings modal stores credentials in-session; treat as prototype until CMS destination is hardened.
- Oakridge: pending local verify after inspecting existing SponsorsSection change.

# Accessibility report

## Verified in source and browser smoke

- Skip links exist on public, institution, auth, and member shells.
- Routes use semantic headings and main landmarks.
- Shared inputs use labels; Radix primitives supply keyboard/focus management for dialogs, sheets, selects, and menus.
- Global `:focus-visible` treatment is visible against the dark UI.
- Loading components expose `role="status"` and polite live regions.
- Reduced-motion CSS disables marquee, shimmer, pulse, scanline, page entrance, and hover transforms.
- Mobile navigation uses a named button and focus-managed sheet.
- Statuses combine text with color rather than color alone.

## Remaining evidence gap

No automated axe/Playwright accessibility suite or screen-reader session was run in this pass. Before public release, keyboard-complete signup, onboarding, project application, evidence submission, review, account export, and admin review should be recorded at 320px and desktop widths.

## Known risk

Many form errors are announced through the Sonner notification region rather than inline field descriptions. This is usable but should be verified with VoiceOver/NVDA during the live E2E pass.

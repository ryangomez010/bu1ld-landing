export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load — The Bu1ld</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0a0a0b" />
    <style>
      * { box-sizing: border-box; }
      body {
        font: 15px/1.6 "Inter Tight", system-ui, -apple-system, sans-serif;
        background: #0a0a0b;
        color: #f2ebdd;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
      }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .eyebrow { font: 500 10px/1 "JetBrains Mono", monospace; letter-spacing: 0.35em; text-transform: uppercase; color: #e2473d; margin: 0 0 1rem; }
      h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.75rem; letter-spacing: -0.02em; }
      p { color: #a1a1aa; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: 0.625rem 1.25rem;
        border-radius: 2px;
        font: 500 10px/1 "JetBrains Mono", monospace;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
      }
      .primary { background: #f2ebdd; color: #0a0a0b; border: none; }
      .secondary { background: transparent; color: #a1a1aa; border-color: rgba(242,235,221,0.25); }
      .secondary:hover { color: #f2ebdd; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">error</p>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. Refresh the page or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

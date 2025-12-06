# html (static files)

`html` serves static files (HTML, JS, CSS, images, etc.) from a directory with guardrails similar to `express.static`: traversal blocking, dotfiles ignored by default, symlink checks, and SPA fallback support.

## Quick usage

```ts
import { Wobe, html } from 'wobe'
import { join } from 'node:path'

const staticRoot = join(__dirname, '../fixtures')

new Wobe()
	// Serve under /tata while stripping that prefix for file resolution
	.get(
		'/tata/*',
		html({
			rootPath: staticRoot,
			fallbackFile: 'index.html', // optional for SPA
			stripPrefix: '/tata',
		})
	)
	.listen(3000)

// http://localhost:3000/tata/test.html -> serves fixtures/test.html
// http://localhost:3000/tata/unknown -> serves fixtures/index.html (fallback)
```

## Options

-   `rootPath` (string, required): root directory of static files.
-   `fallbackFile` (string, optional): file served on 404, useful for SPAs (`text/html`).
-   `stripPrefix` (string, optional): prefix to strip from the pathname when mounted under a sub-path (e.g. `/static` or `/tata`).
-   `allowDotfiles` (boolean, default `false`): serve dotfiles; otherwise they return 404.
-   `allowSymlinks` (boolean, default `false`): allow symlinks pointing outside `rootPath`; otherwise realpath must stay inside root or 403.

## Behavior and safety

-   **Methods**: only `GET` and `HEAD` are accepted (`405` otherwise). HEAD returns headers only.
-   **Dotfiles**: ignored by default (404).
-   **Traversal / symlinks**: path is normalized + realpathed and must stay under `rootPath` unless `allowSymlinks` is true; otherwise 403.
-   **Content-Type**: inferred from extension (built-in MIME table); text read via `.text()`, binary via `arrayBuffer()`.
-   **SPA fallback**: served only if it resolves inside root (same symlink rule); otherwise 403.
-   **Mounted prefixes**: use `stripPrefix` to exclude the mount prefix from file resolution.

# Secure headers

Wobe has a secure headers `beforeHandler` hook that allow to set secure headers on your server. It can be considered as an equivalence of `helmet` for express.

## Example

```ts
import { Wobe, secureHeaders } from 'wobe'

const app = new Wobe()

app.beforeHandler(
	secureHeaders({
		contentSecurityPolicy: {
			'default-src': ["'self'"],
			'report-to': 'endpoint-5',
		},
	}),
)

app.get('/', (req, res) => {
	res.send('Hello World!')
})

app.listen(3000)
```

## Options

-   `contentSecurityPolicy` : An object that contains the content security policy directives. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
-   `crossOriginEmbedderPolicy` (string) : The Cross-Origin-Embedder-Policy header value. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
-   `crossOriginOpenerPolicy` (string) : The Cross-Origin-Opener-Policy header value. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
-   `crossOriginResourcePolicy` (string) : The Cross-Origin-Resource-Policy header value. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cross-Origin_Resource_Policy)
-   `referrerPolicy` (string) : The Referrer-Policy header value. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
-   `strictTransportSecurity` (string[]) : The Strict-Transport-Security header value. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
-   `xContentTypeOptions` (string) : The X-Content-Type-Options header value. [For more informations](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
-   `xDownloadOptions` (string) : The X-Download-Options header value.

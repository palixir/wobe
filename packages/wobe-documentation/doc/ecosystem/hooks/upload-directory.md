# Upload Directory

Wobe provides an `uploadDirectory` hook to easily serve files from a specified directory. This hook allows you to access files by providing a filename parameter in the route.

## Example

A simple example to serve files from a directory.

```ts
import { Wobe, uploadDirectory } from 'wobe';

const app = new Wobe()
  .get('/bucket/:filename', uploadDirectory({
    directory: './bucket',
  }))
  .listen(3000);

// A request like this will serve the file `example.jpg` from the `./bucket` directory
const request = new Request('http://localhost:3000/bucket/example.jpg');
```

## Options

-   `directory` (string) : The directory path from which to serve files. This path should be relative to your project's root directory or an absolute path.
-   `isAuthorized` (boolean) : A boolean value indicating whether the hook should check if the request is authorized. If set to `true`, the hook will be authorized to serve files, otherwise, it will be unauthorized. The default value is `true`. Usefull for example to allow access files only in development mode (with for example S3 storage on production).

## Usage

To use the uploadDirectory hook, define a route in your Wobe application and pass the directory path as an option. The hook will handle requests to this route by serving the specified file from the directory.

```ts
import { Wobe, uploadDirectory } from 'wobe';

const app = new Wobe()
  .get('/bucket/:filename', uploadDirectory({
    directory: './path/to/your/directory',
  }))
  .listen(3000);
```

## Error Handling

The `uploadDirectory` hook handles errors gracefully by providing appropriate HTTP responses for common issues:

- **Missing Filename Parameter**: If the `filename` parameter is missing in the request, the hook will respond with a `400 Bad Request` status and the message "Filename is required".

```ts
  const response = await fetch('http://localhost:3000/bucket/');
  console.log(response.status); // 400
  console.log(await response.text()); // "Filename is required"
```

- **File Not Found**: If the file specified by the `filename` parameter does not exist in the directory, the hook will respond with a `404 Not Found` status and the message "File not found".

```ts
  const response = await fetch('http://localhost:3000/bucket/non-existent-file.txt');
  console.log(response.status); // 404
  console.log(await response.text()); // "File not found"
```

# Contribution Guidelines

Contributions are welcome! Here's how you can help:

-   **Report a bug**: If you find a bug, please open an issue.
-   **Request a feature**: If you have an idea for a feature, please open an issue.
-   **Create a pull request**: If you can fix a bug or implement a feature, please create a pull request (I promise a quick review).
-   **Use Wobe**: The best way to contribute is to use Wobe in your application.

## Install

Wobe uses Bun, so you need the latest version of Bun. You can see [here](https://bun.sh/docs/installation) if Bun is not installed on your machine.

Wobe uses a monorepo organization, all the packages are under the `packages` directory.

Once you have cloned the repository you can run the following command at the root of the project.

```sh
bun install
```

You can run the tests in all packages by running the following commands at the root repository:

```sh
bun test # Run test on all packages
# or
bun ci # Run test and lint on all packages
```

## Pre-commit

Before any commit a pre-commit command that will run on your machine to ensure that the code is correctly formatted and the lint is respected. If you have any error of formatting during the pre-commit you can simply run the following command (at the root of the repository):

```sh
bun format
```

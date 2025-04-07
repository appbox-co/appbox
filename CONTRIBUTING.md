# Contributing to Appbox

Thank you for your interest in contributing to Appbox! We're excited to have you join our community of contributors. This document provides guidelines and instructions to help you get started.

## Licensing and Copyright

By contributing to this project, you agree that your contributions will be licensed under the project's MIT license. While you retain the copyright to your contributions, you grant Appbox and all other users the rights specified in our MIT license.

## Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** to your local machine
3. **Install dependencies** with `pnpm install`
4. **Start the development server** with `pnpm dev`

## Development Workflow

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and ensure they follow our code style guidelines

3. **Run linting** to ensure code quality:
   ```bash
   pnpm lint:fix
   ```

4. **Test your changes** locally

5. **If working with documentation or content**, rebuild the contentlayer cache:
   ```bash
   cd apps/web
   pnpm contentlayer:build
   ```
   This is necessary when adding new docs, modifying content structure, or changing the contentlayer configuration.

6. **Commit your changes** using conventional commit format:
   ```bash
   git commit -m "feat: add new feature"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a pull request** to the main repository

## Code Style Guidelines

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Write clean, maintainable, and testable code
- Follow TypeScript best practices

## Pull Request Guidelines

1. Keep PRs focused on a single issue or feature
2. Ensure your code passes all linting checks
3. Rebase your branch on the latest main branch before submitting
4. Include clear descriptions of your changes
5. Reference any related issues using GitHub's issue linking

## Documentation Contributions

We especially welcome contributions to our documentation:

- Improving existing documentation
- Adding documentation for apps
- Fixing typos or clarifying existing content
- Adding tutorials or how-to guides

When working with documentation, remember to rebuild the contentlayer cache after making changes:
```bash
cd apps/web
pnpm contentlayer:build
```

This ensures your content changes are properly processed and visible in the local development environment.

## Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in our [issue tracker](https://github.com/appbox-co/appbox/issues)
2. If not, create a new issue with a descriptive title and detailed information

## Questions or Need Help?

If you have questions or need help, you can:
- Open an issue with your question
- Contact our support team at [support](https://billing.appbox.co/submitticket.php)

Thank you for contributing to Appbox! 
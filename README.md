<p align="center">
  <img src="https://www.appbox.co/appbox-gradient-box-purple.svg" alt="Appbox Logo" width="150" height="auto" />
</p>

# Appbox Website and Control Panel

## About Appbox

Appbox provides blazing fast app hosting with tailored, optimized cloud services customizable to your needs. Our platform offers a range of features including one-click app installations, VPN services, Plex media server support, root access, and more.

## Project Overview

This repository contains the open-source code for the [Appbox](https://www.appbox.co) website and our upcoming control panel. We've decided to make this project open source to:

- Foster community involvement in our platform's development
- Improve transparency in how we operate
- Allow our users to contribute directly to features they care about
- Enable community contributions to our documentation
- Build a better product through collaborative development

## Features

- **Next.js-based website**: Modern, fast, and SEO-optimized
- **Comprehensive documentation**: Detailed guides for all aspects of our service
- **Multi-language support**: Documentation available in multiple languages
- **Interactive control panel**: (Coming soon) Manage your Appbox services with ease

## Getting Started

### Prerequisites

- Node.js 23.11.0 or later
- pnpm (we use this as our package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Appbox-co/Appbox.git
   cd website
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
.
├── apps/
│   ├── content/               # Content files
│   │   ├── blog/              # Blog posts in MDX format
│   │   │   ├── en/            # English blog posts
│   │   │   └── pt/            # Portuguese blog posts
│   │   ├── docs/              # Documentation in MDX format
│   │   │   ├── en/            # English documentation
│   │   │   └── pt/            # Portuguese documentation
│   │   └── policies/          # Policy documents in MDX format
│   │       └── en/            # English policy documents
│   └── web/                   # Next.js web application
│       ├── public/            # Static assets
│       └── src/               # Source code
│           ├── app/           # Next.js app router
│           ├── components/    # React components
│           ├── config/        # Site configuration
│           ├── i18n/          # Internationalization
│           ├── lib/           # Utility libraries
│           └── styles/        # CSS styles
└── packages/                  # Shared packages
    ├── eslint-config/         # ESLint configuration
    └── typescript-config/     # TypeScript configuration
```

## Contributing

We welcome contributions from everyone, especially for documentation! Here's how you can contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This helps us generate changelogs and makes commit messages more readable.

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]
```

Common types include:
- `docs`: Documentation changes
- `feat`: New features
- `fix`: Bug fixes
- `chore`: Maintenance tasks
- `style`: Code style/formatting changes
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or correcting tests

Examples:
```
feat: add support for Polish language
fix(docs): correct typos in installation guide
chore: update dependencies to latest versions
```

Our repository has a commit-msg hook that enforces this format.

### Documentation Contributions

To add new documentation:

1. Create a new `.mdx` file in the `apps/content/docs/[language]` folder.
2. Add the document to the navigation menu in `src/config/docs.ts`.

For more details, see our [Adding New Docs](./apps/content/docs/en/adding-new-docs.mdx) guide.

## Community

- [Discord](https://discord.gg/appbox) - Join our community chat
- [Twitter](https://twitter.com/appboxhosting) - Follow us for updates
- [Support Tickets](https://www.appbox.co/support) - Get help with your service

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Thanks to all our users who provide valuable feedback
- Special appreciation to our contributors who help make this project better
- [OpenDocs](https://github.com/daltonmenezes/opendocs) for the documentation framework

---

We're excited about this new project and can't wait to see what we can build together with the community!
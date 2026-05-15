<p align="center">
  <img src="https://www.appbox.co/appbox-gradient-box-purple.svg" alt="Appbox Logo" width="150" height="auto" />
</p>

<div align="center">
  <h1>Appbox Website and Control Panel</h1>
</div>

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
   git clone https://github.com/appbox-co/appbox.git
   cd website
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. (Internal use only) Enable admin module for admin instance:

   ```bash
   git submodule update --init --recursive apps/web/admin-module
   ```

   To refresh it later:

   ```bash
   git submodule update --remote apps/web/admin-module
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

## Dashboard Design Language

Dashboard pages should share the same high-level rhythm as `apps/web/src/app/[locale]/(dashboard)/dashboard`: use `space-y-6` or `space-y-8` for page sections, keep content surfaces rounded and bordered, and pair clear titles with short descriptions that explain what the page is for.

## Guarded API Mutations

Some Cylo API mutations are protected by the backend mutation guard. Frontend calls to these endpoints must send a fresh `Idempotency-Key` for every real user action and surface backend guard errors to the user.

Guarded frontend calls currently include:

| Frontend area                   | API wrapper or module               | Backend operation                                                 | Header behavior                                                                 | Error behavior                                              |
| ------------------------------- | ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| User dashboard app actions      | `startApp()`                        | `app_instance.start`                                              | Sends `Idempotency-Key` via `idempotencyHeaders("app_instance.start")`          | `useStartApp()` shows `error.message` in a toast            |
| User dashboard app actions      | `stopApp()`                         | `app_instance.stop`                                               | Sends `Idempotency-Key` via `idempotencyHeaders("app_instance.stop")`           | `useStopApp()` shows `error.message` in a toast             |
| User dashboard app actions      | `restartApp()`                      | `app_instance.restart`                                            | Sends `Idempotency-Key` via `idempotencyHeaders("app_instance.restart")`        | `useRestartApp()` shows `error.message` in a toast          |
| User dashboard version switcher | `switchVersion()`                   | `app_instance.switch_version`                                     | Sends `Idempotency-Key` via `idempotencyHeaders("app_instance.switch_version")` | Existing confirmation dialog shows `error.message` inline   |
| User dashboard custom buttons   | `triggerCustomButton()`             | `custom_button.execute`                                           | Sends `Idempotency-Key` via `idempotencyHeaders("custom_button.execute")`       | `useTriggerCustomButton()` shows `error.message` in a toast |
| Admin installed apps            | Direct `adminPut()` lifecycle calls | `app_instance.start`, `app_instance.stop`, `app_instance.restart` | Sends the matching lifecycle `Idempotency-Key`                                  | Admin actions show `error.message` in a toast               |

Use `apps/web/src/api/idempotency.ts` for new guarded calls instead of hand-rolling headers. The key format is `appbox-web:<operation>:<uuid>`, and the backend rejects reuse of the same key for the same scoped operation for the mutation guard TTL, currently 300 seconds. Generate a new key for each intentional user action, including normal manual retries; this guard rejects duplicate submissions instead of replaying the original response.

### Page Headers

Use `DashboardPageHeader` from `apps/web/src/components/dashboard/page-header.tsx` for dashboard and account-style page headers. Each header should include:

- A `text-lg font-semibold leading-tight` title.
- A short `text-xs text-muted-foreground` description.
- A `size-10` rounded gradient icon tile with a white `size-[18px]` icon.
- An optional right-aligned action, such as a primary button, status badge, or compact action group.

Detail pages should keep the same header pattern after the `HistoryBackButton`. Put secondary identifiers, server names, or contextual metadata in the description area instead of building a separate title row.

### Cards And Links

Use `Card` surfaces with `rounded-xl`/`rounded-lg` edges, `border`, and `bg-card`. Card headers should generally use `CardHeader className="pb-3"` and `CardTitle className="flex items-center gap-2 text-base"` with a small muted icon.

Clickable cards should visibly behave like links:

- Add `group`, `cursor-pointer`, `transition-all`, `hover:-translate-y-0.5`, `hover:border-primary/40`, and a focus-visible ring.
- Include `CardLinkHint` next to the card title when the whole card navigates.
- Use `role="link"` and keyboard handling when the card is not a native link element.

Use `card-glow` for prominent dashboard/account cards that should match the glowing dashboard surfaces. Avoid applying it to plain data tables.

### Tables

Tables follow the installed-apps page pattern:

- If the table is the only primary content on the page, render the `DataTable` or bordered table directly below the header and toolbar.
- If the table appears alongside other page content, wrap it in a `Card` so it reads as one section among several.
- Prefer `DataTable` for searchable/filterable lists and keep its direct `rounded-md border` table shell visible.

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

## Submit Your Own App

Appbox welcomes community-submitted apps — whether you've built your own application or you're packaging an existing open-source app from another developer for the platform.

**Get started with our example app:** [github.com/appbox-co/example-app](https://github.com/appbox-co/example-app)

The example repository includes everything you need:

- **`appbox.yml`** — Single configuration file defining your app's metadata, ports, volumes, environment variables, and custom fields
- **`Dockerfile`** — Container image wrapping an upstream image with the Appbox entrypoint
- **`entrypoint.sh`** — Lifecycle script handling first-run setup, upgrades, and platform callbacks
- **`moduser.sh`** — Password recovery script (required for all apps)
- **Full documentation** — Schema reference, template variables, field types, validation rules, and a testing framework

### Key requirements

- Apps must be fully self-contained in a **single Docker container** (no docker-compose or external dependencies)
- The main process must run as **UID 1000** inside the container
- All apps must include an **entrypoint lifecycle** (setup, upgrade detection, API callback) and a **password change script** (`moduser.sh`)
- Apps should be **secure by default** — strong password validation, no default credentials, public registration disabled

### How to submit

1. Package your app following the [example-app](https://github.com/appbox-co/example-app) template
2. Test all three container states (fresh install, upgrade, restart) using the included [testing framework](https://github.com/appbox-co/example-app/blob/main/TESTING.md)
3. Push your image to the Appbox registry
4. Open a [support ticket](https://billing.appbox.co/submitticket.php?step=2&deptid=1) with your app details

Our team reviews every submission for security, stability, and adherence to platform conventions.

## Community

- [Support Tickets](https://billing.appbox.co/submitticket.php?step=2&deptid=3) - Get help with your service

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Thanks to all our users who provide valuable feedback
- Special appreciation to our contributors who help make this project better
- [OpenDocs](https://github.com/daltonmenezes/opendocs) for the documentation framework

---

We're excited about this new project and can't wait to see what we can build together with the community!

# NodeJS Projects

### Getting Started

- Install Lerna: `npm i -g lerna`.
- Bootstrap Node Modules with Lerna: `lerna bootstrap --hoist --strict`.
- Run NPM scripts: `npm run [CMD]`.

### Using Lerna to run multiple commands.

- Lint all packages: `lerna run lint`.
- Build all packages: `lerna run build`.
- Test all packages: `lerna run test`.
- Start all packages: `lerna run start`.

### Setting up Mailgun for End-to-End Testing

1. Create an account at [mailgun.org](https://www.mailgun.org).
2. Set up a domain with your domain name. **Note:** You will need to have control of your DNS to verify your domain.
3. Update the `MAILGUN_DOMAIN` and `MAILGUN_SECRET` with your values.

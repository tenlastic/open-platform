# NodeJS Projects

### Getting Started

- Install Docker and Docker Compose.
- Install Root Node Modules: `npm run docker:install`.
- Bootstrap Node Modules with Lerna: `npm run docker lerna bootstrap`.
- Run NPM scripts within Docker: `npm run docker [CMD]`.

## Using Lerna to run multiple commands.

- Lint all packages: `lerna run docker -- lint`.
- Build all packages: `lerna run docker -- build`.
- Test all packages: `lerna run docker -- test`.
- Start all packages: `lerna run docker -- start`.

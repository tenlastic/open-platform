# NodeJS Projects

### Local Development Ports

- 3000: Authentication API
- 3001: Namespace API
- 3002: Database API
- 3003: Game API
- 3004: Article API
- 3005: Release API
- 3006: Social API
- 3007: Game Server API
- 8080: Home UI
- 8081: Portal UI
- 8082: SSO UI
- 8083: Launcher UI
- 9000: Minio
- 27017: MongoDB
- 27018: MongoDB
- 27019: MongoDB

### Getting Started

- Install Docker and Docker Compose.
- Install Node Modules: `lerna bootstrap`.

### Using Lerna to run multiple commands.

- Lint all packages: `lerna run docker -- lint`.
- Build all packages: `lerna run docker -- build`.
- Test all packages: `lerna run docker -- test`.
- Start all packages: `lerna run docker -- start`.

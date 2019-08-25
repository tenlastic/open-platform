# NodeJS Projects

### Getting Started

- Install Docker and Docker Compose.
- Install Root Node Modules: `npm run docker:install`.
- Bootstrap Node Modules with Lerna: `npm run docker lerna bootstrap`.
- Run NPM scripts within Docker: `npm run docker [CMD]`.

### Using Lerna to run multiple commands.

- Lint all packages: `lerna run docker -- lint`.
- Build all packages: `lerna run docker -- build`.
- Test all packages: `lerna run docker -- test`.
- Start all packages: `lerna run docker -- start`.

### Setting up Mailgun for End-to-End Testing

1. Create an account at [mailgun.org](https://www.mailgun.org).
2. Set up a domain with your domain name. **Note:** You will need to have control of your DNS to verify your domain.
3. Update the `MAILGUN_DOMAIN` and `MAILGUN_KEY` with your values.

### Setting up Gmail for End-to-End Testing

1. Use [this wizard](https://console.developers.google.com/start/api?id=gmail) to create or select a project in the Google Developers Console and automatically turn on the API. **Click Continue**, then **Go to credentials**.
2. On the \*Add credentials to your project\*\* page, click the **Cancel** button.
3. To the left of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter an **Application Name** if not already set, and click the **Save** button.
4. Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
5. Select the application type **Other**, enter the name **Gmail API**, and click the **Create** button.
6. Close the dialog box. Instead, click the **Download** button next to the new credential.
7. Set the **E2E_GMAIL_CLIENT_ID** environment variable to the **client_id** value within the file.
8. Set the **E2E_GMAIL_CLIENT_SECRET** environment variable to the **client_secret** value within the file.
9. Set the **E2E_GMAIL_REDIRECT_URI** environment variable to the first **redirect_uris** array value within the file.
10. Run `npm run docker google:tokens`.
11. Set the **E2E_GMAIL_REFRESH_TOKEN** environment variable to the **tokens.refresh_token** value returned from the previous command.

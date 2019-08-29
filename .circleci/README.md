# CircleCI

The Tenlastic Open Platform uses CircleCI to perform Continuous Integration.

### Setting up CircleCI

1. Create an account at (CircleCI)[https://www.circleci.com]] with Github or Bitbucket.
2. Select the account that contains open-platform.
3. Click `Organization Settings` button in the left-hand menu.
4. Click `Contexts` in the second left-hand menu.
5. Click `Create Context`. Name it `open-platform-review`.
6. Enter all required environment variables from each project.
7. Click `Add Project` button in the left-hand menu.
8. Select the `open-platform` repository.
9. CircleCI should start building the project.

import { google } from 'googleapis';
import * as readline from 'readline';

const CLIENT_ID = process.env.E2E_GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.E2E_GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.E2E_GMAIL_REDIRECT_URI;
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
];

(() => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });

  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question('Enter the code from that page here: ', async code => {
    rl.close();

    const token = await oauth2Client.getToken(code);
    console.log(token);
  });
})();

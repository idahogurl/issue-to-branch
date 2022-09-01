const fetch = require('node-fetch');
const { createAppAuth } = require('@octokit/auth-app');

require('dotenv').config();

async function fetchInstallationId(token, owner) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const installationRes = await fetch('https://api.github.com/app/installations', {
    headers,
  });
  const installations = await installationRes.json();

  const installation = installations.find((i) => i.account.login === owner);

  if (installation) {
    return installation.id;
  }
  throw new Error(`Installation for '${owner}' not found`);
}

async function getInstallationId(owner) {
  const auth = createAppAuth({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
  });

  const { token } = await auth({ type: 'app' });
  return fetchInstallationId(token, owner);
}

module.exports = {
  getInstallationId,
};

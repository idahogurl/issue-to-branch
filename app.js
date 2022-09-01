const github = require('./lib/github');

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  app.log('Yay, the app was loaded!');

  app.on('issues.assigned', async (context) => {
    await github.addCreateLinkComment(context);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

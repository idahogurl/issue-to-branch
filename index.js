const github = require('./github');
const config = require('./config');
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  // Your code here
  app.log('Yay, the app was loaded!');

  app.on('issues.assigned', async (context) => {
    const configuration = await config.load(context);
    return github.createIssueBranch(app, context, configuration);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

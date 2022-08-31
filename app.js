const { Context } = require('probot');
const github = require('./lib/github');

const githubAppAuth = require('./lib/github-app-auth');
const configLib = require('./lib/config');

async function createIssueBranch(context, config) {
  const branchName = github.getBranchNameFromIssue(context, config);
  if (await github.branchExists(context, branchName)) {
    // noop
  } else {
    const sha = await github.getSourceBranchHeadSha(context, config);
    await github.createBranch({ context, branchName, sha });
    return branchName;
  }
  return undefined;
}
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app, { getRouter }) => {
  app.log('Yay, the app was loaded!');

  app.on('issues.assigned', async (context) => {
    await github.addCreateLinkComment(context);
  });

  if (getRouter) {
    const router = getRouter('/issue-to-branch');

    router.get('/create/:owner/:repo/issues/:issueId', async (req, res) => {
      const { owner, repo, issueId } = req.params;
      const id = await githubAppAuth.getInstallationId(owner);
      const githubApi = await app.auth(id, app.log);

      const { data: issue } = await githubApi.issues.get({
        owner,
        repo,
        issue_number: issueId,
      });

      const { data: repository } = await githubApi.repos.get({ owner, repo });

      const context = new Context(
        {
          payload: {
            issue,
            repository,
          },
        },
        githubApi,
        app.log,
      );

      const configuration = await configLib.load(context);
      const branchName = await createIssueBranch(context, configuration);
      if (branchName) {
        await github.addCreatedComment(context, branchName);
      }
      res.redirect(`https://www.github.com/${owner}/${repo}/issues/${issueId}`);
    });
  }
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

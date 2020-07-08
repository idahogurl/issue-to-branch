const github = require("./github");
const config = require("./config");
const { Context } = require("probot");
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  // Your code here
  app.log("Yay, the app was loaded!");

  app.on("issues.assigned", async (context) => {
    await github.addCreateLinkComment(context);
  });

  // Get an express router
  const router = app.route("/issue-to-branch");
  router.get("/create/:owner/:repo/issues/:issueId", async (req, res) => {
    const { owner, repo, issueId } = req.params;
    app.githubToken = process.env.GITHUB_TOKEN;
    const githubApi = await app.auth();
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
      app.log
    );
    const configuration = await config.load(context);
    const branchName = await github.createIssueBranch(context, configuration);
    if (branchName) {
      await github.addCreatedComment(context, branchName);
    }
    res.redirect(`https://www.github.com/${owner}/${repo}/issues/${issueId}`);
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

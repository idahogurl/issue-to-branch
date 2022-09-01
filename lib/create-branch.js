const { Context, createProbot } = require('probot');

const { getInstallationId } = require('./github-app-auth');
const { loadConfig } = require('./config');
const github = require('./github');

async function getAuthApp(owner, probot) {
  const id = await getInstallationId(owner);
  return probot.auth(id, probot.log);
}

async function getContext({
  githubApi, owner, repo, issueId, logger,
}) {
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
    logger,
  );
  return context;
}

async function createIssueBranch({ owner, repo, issueId }) {
  const probot = createProbot();
  const githubApi = await getAuthApp(owner, probot);

  const context = await getContext({
    githubApi,
    owner,
    repo,
    issueId,
    logger: probot.log,
  });

  const configuration = await loadConfig(context);

  const branchName = github.getBranchNameFromIssue(context, configuration);
  if (await github.branchExists(context, branchName)) {
    // noop
  } else {
    const sha = await github.getSourceBranchHeadSha(context);
    await github.createBranch({ context, branchName, sha });
    await github.addCreatedComment(context, branchName);
  }
}

module.exports = {
  createIssueBranch,
};

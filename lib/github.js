const utils = require('./utils');

function getBranchNameFromIssue(context, config) {
  const {
    issue: { number, title },
  } = context.payload;
  const branchPrefix = utils.makePrefixGitSafe(config.branchPrefix);
  // default to 1 for the issue number
  const prefixWordCt = branchPrefix ? branchPrefix.split('-').length : 1;
  let result;
  let wordCount;
  switch (config.branchName) {
    case 'tiny':
      result = `${number}`;
      break;
    case 'short':
      result = `${number}`;
      break;
    case 'full':
      result = `${number}-${title}`;
      break;
    default:
      // 'long'
      result = `${number}-${title}`;
      wordCount = (config.titleWordCount || 5) + prefixWordCt;
      break;
  }
  const replaceChar = config.replacementCharacter === 'underscore' ? '_' : '-';
  const branchName = utils.makeGitSafe(result, replaceChar, wordCount);
  return `${branchPrefix ? `${branchPrefix}-` : ''}${branchName}`;
}

async function branchExists(context, branchName) {
  const { owner, repo } = context.repo();
  try {
    await context.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function getBranchHeadSha(context, branch) {
  const { owner, repo } = context.repo();
  try {
    const res = await context.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const ref = res.data.object;
    return ref.sha;
  } catch (e) {
    return undefined;
  }
}

async function getSourceBranchHeadSha(context) {
  const { default_branch: defaultBranch } = context.payload.repository;
  return getBranchHeadSha(context, defaultBranch);
}

async function createBranch({ context, branchName, sha }) {
  const { owner, repo } = context.repo();
  const res = await context.octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha,
  });
  return res;
}

async function createLinkExists(context) {
  const { owner, repo, issue_number: issueNumber } = context.issue();
  const { data: comments } = await context.octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const comment = comments.find(
    (c) => c.user.login === 'issue-to-branch[bot]'
      && c.body.includes(' to create a branch for this issue'),
  );
  if (comment) {
    return true;
  }
}

async function addCreateLinkComment(context) {
  const exists = await createLinkExists(context);
  if (!exists) {
    const { owner, repo, issue_number: issueNumber } = context.issue();
    const body = `Click [here](https://issue-to-branch-idahogurl.vercel.app/api/create?owner=${owner}&repo=${repo}&issue=${issueNumber}) to create a branch for this issue`;
    return context.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  }
}

async function addCreatedComment(context, branchName) {
  const { owner, repo, issue_number: issueNumber } = context.issue();

  const body = `Branch [${branchName}](https://github.com/${owner}/${repo}/tree/${branchName}) 
created for this issue. Run command below in your terminal to checkout branch.<br>\`git fetch && git checkout ${branchName}\``;

  return context.octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}

module.exports = {
  branchExists,
  getBranchNameFromIssue,
  getSourceBranchHeadSha,
  createBranch,
  addCreateLinkComment,
  addCreatedComment,
};

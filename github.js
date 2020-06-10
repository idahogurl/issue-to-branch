const utils = require('./utils');

async function createIssueBranch(app, context, config) {
  const branchName = getBranchNameFromIssue(context, config);
  if (await branchExists(context, branchName)) {
    // nop
  } else {
    const sha = await getSourceBranchHeadSha(context, config);
    await createBranch({ context, branchName, sha });
  }
}

function getBranchNameFromIssue(context, config) {
  const {
    issue: { number, title },
  } = context.payload;
  const branchPrefix = utils.makePrefixGitSafe(config.branchPrefix);
  const prefixWordCt = branchPrefix ? branchPrefix.split('-').length : 0;
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

function getRepoOwner({ repository }) {
  return repository.owner.login;
}

function getRepoName({ repository }) {
  return repository.name;
}

async function branchExists(context, branchName) {
  const owner = getRepoOwner(context.payload);
  const repo = getRepoName(context.payload);
  try {
    await context.github.git.getRef({
      owner: owner,
      repo: repo,
      ref: `heads/${branchName}`,
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function getSourceBranchHeadSha(context) {
  const { default_branch: defaultBranch } = context.payload.repository;
  return await getBranchHeadSha(context, defaultBranch);
}

async function getBranchHeadSha(context, branch) {
  const owner = getRepoOwner(context.payload);
  const repo = getRepoName(context.payload);
  try {
    const res = await context.github.git.getRef({
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

async function createBranch({ context, branchName, sha }) {
  const owner = getRepoOwner(context.payload);
  const repo = getRepoName(context.payload);
  const res = await context.github.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${branchName}`,
    sha: sha,
  });
  return res;
}

module.exports = {
  createIssueBranch: createIssueBranch,
  getBranchNameFromIssue: getBranchNameFromIssue,
  createBranch: createBranch,
};

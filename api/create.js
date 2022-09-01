const { createIssueBranch } = require('../lib/create-branch');

module.exports = async function handler(request, response) {
  const { owner, repo, issueId } = request.query;
  createIssueBranch(request.query);
  response.redirect(`https://www.github.com/${owner}/${repo}/issues/${issueId}`);
};

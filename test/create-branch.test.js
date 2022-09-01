const nock = require('nock');
const GitHub = require('../lib/github');

const createBranchSpy = jest.spyOn(GitHub, 'createBranch');
const addCreatedCommentSpy = jest.spyOn(GitHub, 'addCreatedComment');

const { createIssueBranch } = require('../lib/create-branch');

const installationsPayload = require('./fixtures/installations.json');
const repository = require('./fixtures/repository.json');
const issue = require('./fixtures/issue.json');

jest.mock('@octokit/auth-app', () => ({
  createAppAuth: () => () => Promise.resolve({ token: 'test' }),
}));

describe('GET /create/:owner/:repo/issues/:issueId', () => {
  function initializeNock() {
    nock.enableNetConnect('127.0.0.1');

    nock('https://api.github.com');

    nock('https://api.github.com')
      .post('/app/installations/1/access_tokens')
      .reply(200, { token: 'test' });

    nock('https://api.github.com').get('/app/installations').reply(200, installationsPayload);

    nock('https://api.github.com')
      .get(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}`)
      .reply(200, issue);

    nock('https://api.github.com')
      .get(`/repos/${repository.owner.login}/${repository.name}`)
      .reply(200, repository);
  }

  test('should do nothing when branch exists', async () => {
    initializeNock();

    nock('https://api.github.com')
      .get(
        `/repos/${repository.owner.login}/${repository.name}/contents/.github%2Fissue-branch.yml`,
      )
      .reply(404);

    nock('https://api.github.com')
      .get(`/repos/${repository.owner.login}/.github/contents/.github%2Fissue-branch.yml`)
      .reply(404);

    nock('https://api.github.com')
      .get(
        `/repos/${repository.owner.login}/${repository.name}/git/ref/heads%2F${issue.number}-test-issue`,
      )
      .reply(200);

    await createIssueBranch({
      owner: repository.owner.login,
      repo: repository.name,
      issueId: issue.number,
    });
    expect(createBranchSpy).not.toHaveBeenCalled();
  });

  test('should create a branch when branch does not exist', async () => {
    initializeNock();

    // -- no config file found ---
    nock('https://api.github.com')
      .get(
        `/repos/${repository.owner.login}/${repository.name}/contents/.github%2Fissue-branch.yml`,
      )
      .reply(404);

    nock('https://api.github.com')
      .get(`/repos/${repository.owner.login}/.github/contents/.github%2Fissue-branch.yml`)
      .reply(404);
    // -- --

    nock('https://api.github.com')
      .get(
        `/repos/${repository.owner.login}/${repository.name}/git/ref/heads%2F${issue.number}-test-issue`,
      )
      .reply(404);

    nock('https://api.github.com')
      .get(
        `/repos/${repository.owner.login}/${repository.name}/git/ref/heads%2F${repository.default_branch}`,
      )
      .reply(200, {
        object: { sha: 123 },
      });

    nock('https://api.github.com')
      .post(`/repos/${repository.owner.login}/${repository.name}/git/refs`)
      .reply(201);

    nock('https://api.github.com')
      .post(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}/comments`)
      .reply(201);
    await createIssueBranch({
      owner: repository.owner.login,
      repo: repository.name,
      issueId: issue.number,
    });
    expect(createBranchSpy).toHaveBeenCalled();
    expect(addCreatedCommentSpy).toHaveBeenCalled();
  });
});

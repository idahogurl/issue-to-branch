/* eslint-env jest, node */

const nock = require('nock');
const { Probot, Server, ProbotOctokit } = require('probot');
const pino = require('pino');
const Stream = require('stream');
const request = require('supertest');

const GitHub = require('../lib/github');

const createBranchSpy = jest.spyOn(GitHub, 'createBranch');
const addCreatedCommentSpy = jest.spyOn(GitHub, 'addCreatedComment');

const myProbotApp = require('../app');

const issuesAssignedEvent = require('./fixtures/issues.assigned.json');
const installationsPayload = require('./fixtures/installations.json');
const repository = require('./fixtures/repository.json');
const issue = require('./fixtures/issue.json');

const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIBOQIBAAJBAIILhiN9IFpaE0pUXsesuuoaj6eeDiAqCiE49WB1tMB8ZMhC37kY
Fl52NUYbUxb7JEf6pH5H9vqw1Wp69u78XeUCAwEAAQJAb88urnaXiXdmnIK71tuo
/TyHBKt9I6Rhfzz0o9Gv7coL7a537FVDvV5UCARXHJMF41tKwj+zlt9EEUw7a1HY
wQIhAL4F/VHWSPHeTgXYf4EaX2OlpSOk/n7lsFtL/6bWRzRVAiEArzJs2vopJitv
A1yBjz3q2nX+zthk+GLXrJQkYOnIk1ECIHfeFV8TWm5gej1LxZquBTA5pINoqDVq
NKZSuZEHqGEFAiB6EDrxkovq8SYGhIQsJeqkTMO8n94xhMRZlFmIQDokEQIgAq5U
r1UQNnUExRh7ZT0kFbMfO9jKYZVlQdCL9Dn93vo=
-----END RSA PRIVATE KEY-----`;

jest.mock('@octokit/auth-app', () => ({
  createAppAuth: () => () => Promise.resolve({ token: 'test' }),
}));

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

afterAll(() => {
  nock.restore();
});

describe('on issue.assigned', () => {
  let probot;
  // config found and not found
  function initializeNock() {
    nock('https://api.github.com');

    nock('https://api.github.com')
      .post('/app/installations/1/access_tokens')
      .reply(200, { token: 'test' });
  }

  function loadInstance() {
    const probotInstance = new Probot({
      githubToken: 'test',
      // Disable throttling & retrying requests for easier testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    probotInstance.load(myProbotApp);
    return probotInstance;
  }

  function setup() {
    initializeNock();
    probot = loadInstance();
  }
  test('creates a comment to create if comment does not exist', async () => {
    setup();
    const createComment = jest.spyOn(probot.state.octokit.issues, 'createComment');

    nock('https://api.github.com')
      .get(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}/comments`)
      .reply(200, []);

    nock('https://api.github.com')
      .post(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}/comments`)
      .reply(201);

    // Receive a webhook event
    await probot.receive({ name: 'issues', payload: issuesAssignedEvent });

    expect(createComment).toHaveBeenCalled();
  });
  test('when comment already exists', async () => {
    setup();

    const createComment = jest.spyOn(probot.state.octokit.issues, 'createComment');

    nock('https://api.github.com')
      .get(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}/comments`)
      .reply(200, [
        {
          user: { login: 'issue-to-branch[bot]' },
          body: ' to create a branch for this issue',
        },
      ]);

    // Receive a webhook event
    await probot.receive({ name: 'issues', payload: issuesAssignedEvent });

    expect(createComment).not.toHaveBeenCalled();
  });
});

// when branch exists, when branch doesn't exist
describe('GET /create/:owner/:repo/issues/:issueId', () => {
  let server;
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

  async function loadInstance() {
    const output = [];
    const streamLogsToOutput = new Stream.Writable({ objectMode: true });
    // eslint-disable-next-line no-underscore-dangle
    streamLogsToOutput._write = (object, encoding, done) => {
      output.push(JSON.parse(object));
      done();
    };
    const log = pino(streamLogsToOutput);
    const probotServer = new Server({
      Probot: Probot.defaults({
        appId: 123,
        privateKey: PRIVATE_KEY,
        secret: 'secret',
        log: log.child({ name: 'probot' }),
      }),
      log: log.child({ name: 'server' }),
    });

    await probotServer.load((app) => {
      myProbotApp(app, {
        getRouter: (route) => probotServer.router(route),
      });
    });
    return probotServer;
  }
  async function setup() {
    // Allow localhost connections so we can test local routes and mock servers.
    initializeNock();

    server = await loadInstance();
  }

  test('should do nothing when branch exists', async () => {
    await setup();

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

    const response = await request(server.expressApp).get(
      `/issue-to-branch/create/${repository.owner.login}/${repository.name}/issues/${issue.number}`,
    );
    expect(createBranchSpy).not.toHaveBeenCalled();
    expect(response.status).toBe(302);
  });

  test('should create a branch when branch does not exist', async () => {
    await setup();

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

    const response = await request(server.expressApp).get(
      `/issue-to-branch/create/${repository.owner.login}/${repository.name}/issues/${issue.number}`,
    );
    expect(createBranchSpy).toHaveBeenCalled();
    expect(addCreatedCommentSpy).toHaveBeenCalled();
    expect(response.status).toBe(302);
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock

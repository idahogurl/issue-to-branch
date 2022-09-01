/* eslint-env jest, node */

const nock = require('nock');
const { Probot, ProbotOctokit } = require('probot');

const myProbotApp = require('../app');

const issuesAssignedEvent = require('./fixtures/issues.assigned.json');
const repository = require('./fixtures/repository.json');
const issue = require('./fixtures/issue.json');

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

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock

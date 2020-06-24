/* eslint-env jest, node */

const context = require('./fixtures/issues.assigned');
const github = require('../github');

test('tiny branch name', () => {
  expect(github.getBranchNameFromIssue(context, { branchName: 'tiny' })).toBe('10');
});

test('short branch name', () => {
  expect(
    github.getBranchNameFromIssue(context, {
      branchName: 'short',
      branchPrefix: 'issue',
    }),
  ).toBe('issue-10');
});

test('long branch name', () => {
  context.payload.issue.title = 'A very long, long, long title';
  expect(
    github.getBranchNameFromIssue(context, {
      branchName: 'long',
      branchPrefix: 'issue',
    }),
  ).toBe('issue-10-a-very-long-long-long');
});

test('long branch name with no branchPrefix', () => {
  context.payload.issue.title = 'A very long, long, long title';
  expect(
    github.getBranchNameFromIssue(context, {
      branchName: 'long',
    }),
  ).toBe('10-a-very-long-long-long');
});

test('full branch name', () => {
  context.payload.issue.title = 'A very long, long, long title';
  expect(
    github.getBranchNameFromIssue(context, {
      branchName: 'full',
      branchPrefix: 'issue',
    }),
  ).toBe('issue-10-a-very-long-long-long-title');
});

test('word separator', () => {
  context.payload.issue.title = 'A very long, long, long title';
  expect(
    github.getBranchNameFromIssue(context, {
      branchName: 'full',
      branchPrefix: 'issue',
      replacementCharacter: 'underscore',
    }),
  ).toBe('issue-10-a_very_long_long_long_title');
});

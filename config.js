module.exports = {
  load: async function loadConfig(context) {
    const result = await context.config('issue-branch.yml', {});
    return result;
  },
};

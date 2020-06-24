function trim(str, ch) {
  let start = 0;
  let end = str.length;
  // eslint-disable-next-line no-plusplus
  while (start < end && str[start] === ch) ++start;
  // eslint-disable-next-line no-plusplus
  while (end > start && str[end - 1] === ch) --end;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
}

module.exports = {
  makeGitSafe: function makeGitSafe(s, replaceChar, wordCount) {
    const regexp = /(?![-/])[\W]+/g;
    let result = trim(s.toLowerCase(), ' ').replace(regexp, replaceChar).replace(/[/]+$/, '');
    if (wordCount) {
      const words = result.split(replaceChar);
      result = words.slice(0, wordCount).join(replaceChar);
    }
    return trim(result, replaceChar);
  },
  makePrefixGitSafe: function makePrefixGitSafe(s) {
    if (s) {
      const regexp = /(?![-/])[\W]+/g;
      return trim(s, ' ').replace(regexp, '-');
    }
    return undefined;
  },
};

# issue-to-branch

> GitHub app that creates a branch in GitHub when a GitHub issue is assigned.

## Typical Development Workflow
 1. An issue is created, for example: Issue 15: Fix nasty bug!

 *some time may pass*

 2. The issue is assigned
 3. When the issue is assigned this app will create a new issue branch
    (for the example issue this branch will be called `issue-15-fix-nasty-bug`)

## Configuration

### Branch Names

Branch names are generated from the issue, there are 4 options.

 1. `tiny` => issue number, for example: `15`
 2. `short` => the `branchName` prefix followed by the issue number, for example:
    ```
    branchPrefix = 'issue'
    issueNumber = 15
    ```

    becomes
    
    `issue-15`

 3. `long` => the `branchName` prefix followed by the issue number followed by the issue title shortened to number of words defined by the configuration file, for example:

    ```
    issueTitleWordCount = 4
    issueTitle = 'This is a very long long title'
    ```
    becomes

    `issue-15-this-is-a-very`
 
 3. `full` => the word issue followed by the issue number followed by the
    issue title, for example: `issue-15-this-is-a very-long-long-title`
    
    The default is `long`, other types can be configured in the YAML like this:

    ```yaml
    branchName: tiny
    ```

### Replacement Character
The character used to replace spaces in the issue title.

```
replacementCharacter = 'underscore'
issueTitle = 'This is a very long long title'
```

becomes

`issue-15-this_is_a_very`

The default is `hyphen`, other type is `underscore` can be configured in the YAML like this:

```yaml
replacementCharacter: underscore
```

### Issue Title Word Count

The number of words from the issue title to use when `branchName` is set to `long`. 

The default is `5`, the other option is to set a number as demonstrated below.

```yaml
branchName: long
titleWordCount: 2
```

### Branch Name Prefix
The text to place before issue number

```
branchPrefix = 'issue'
issueNumber = 20
issueTitle = 'my issue title'
```
becomes 

`issue-20-my-issue-title`

The default is empty, the other option is to set words as demonstrated below.

```yaml
branchPrefix: issue
```
## Contributing

If you have suggestions for how issue-to-branch could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## Development Setup

```sh
# Install dependencies
yarn install

# Run the bot
yarn start
```
## License

[ISC](LICENSE) © 2020 Rebecca Vest <olserebe@hotmail.com>

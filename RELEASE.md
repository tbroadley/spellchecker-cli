# How to do a release

**Don't run this process on Windows. Otherwise, you'll run into issues like https://github.com/tbroadley/spellchecker-cli/issues/86.**

1. Run `npm version [patch/minor/major]` to bump the version number in `package.json`.
2. Update `CHANGELOG.md` by creating a section for the new version, moving all unreleased changes to that section, and adding a link for the new section at the bottom. Amend these changes into the commit created by `npm version`.
3. Run `git push` to push `master` to GitHub and `git push --tags` to push the Git tag created by `npm version`.
4. Run `yarn` to install dependencies. This is necessary to run `npm publish`.
5. Run `npm login` to log into NPM and `npm publish` to publish the new version to NPM.

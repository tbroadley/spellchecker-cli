# How to do a release

Releases are published to npm by the [Release workflow](.github/workflows/release.yaml) using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers). No npm token is needed, and you don't need to run `npm publish` yourself.

1. Run `npm version [patch/minor/major]` to bump the version number in `package.json`. This creates a commit and a matching Git tag (e.g. `v7.0.6`).
2. Update `CHANGELOG.md` by creating a section for the new version, moving all unreleased changes to that section, and adding a link for the new section at the bottom. Amend these changes into the commit created by `npm version`, then move the tag to the amended commit with `git tag -f vX.Y.Z`.
3. Run `git push` to push `master` to GitHub and `git push --tags` to push the tag.
4. Pushing the tag starts the Release workflow. It checks that the tag matches the version in `package.json`, runs `yarn ci`, and publishes to npm with provenance. Watch it under the repository's Actions tab.

## Trusted publisher settings

The trusted publisher is configured in the package's settings on npmjs.com. It must name:

- Organization or user: `tbroadley`
- Repository: `spellchecker-cli`
- Workflow filename: `release.yaml`

If the workflow file is renamed, update the npm setting to match, or publishing will fail.

# How to do a release

Releases are staged on npm by the [Release workflow](.github/workflows/release.yaml) using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), then approved by a maintainer. No npm token is needed. The workflow can only [stage](https://docs.npmjs.com/staged-publishing) a release, so nothing goes live without a maintainer's 2FA approval.

1. Run `npm version [patch/minor/major]` to bump the version number in `package.json`. This creates a commit and a matching Git tag (e.g. `v7.0.6`).
2. Update `CHANGELOG.md` by creating a section for the new version, moving all unreleased changes to that section, and adding a link for the new section at the bottom. Amend these changes into the commit created by `npm version`, then move the tag to the amended commit with `git tag -f vX.Y.Z`.
3. Run `git push` to push `master` to GitHub and `git push --tags` to push the tag.
4. Pushing the tag starts the Release workflow. It checks that the tag matches the version in `package.json`, runs `yarn ci`, and runs `npm stage publish`. Watch it under the repository's Actions tab.
5. Approve the staged version: on npmjs.com, open the package's **Staged Packages** tab, review it, and click **Approve**. Or run `npm stage list` to find the stage ID, `npm stage download <stage-id>` to inspect the tarball, and `npm stage approve <stage-id>`. Approving requires 2FA. The release isn't public until it's approved.

## Trusted publisher settings

The trusted publisher is configured in the package's settings on npmjs.com. It must name:

- Organization or user: `tbroadley`
- Repository: `spellchecker-cli`
- Workflow filename: `release.yaml`
- Allowed actions: `npm stage publish` only. Leave `npm publish` and `npm dist-tag` turned off.

If the workflow file is renamed, update the npm setting to match, or publishing will fail.

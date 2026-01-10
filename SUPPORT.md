# Support

## Getting Help

### Documentation

- [README](./README.md) — Setup and usage guide
- [CONTRIBUTING](./CONTRIBUTING.md) — Development guide
- [CHANGELOG](./CHANGELOG.md) — Version history

### Community

- **GitHub Discussions** — [Open a discussion](https://github.com/HandInstance/eliza-security-agent/discussions)
- **GitHub Issues** — [Report a bug](https://github.com/HandInstance/eliza-security-agent/issues/new?template=bug_report.md)
- **Twitter/X** — [@ElizaSecAgent](https://x.com/ElizaSecAgent)

### Common Issues

**Q: Getting 403 from GitHub API?**
A: Add `VITE_GITHUB_TOKEN` to your `.env` file. Rate limit is 60/hr unauthenticated, 5000/hr with token.

**Q: Eliza AI chat not responding?**
A: Check that `VITE_ANTHROPIC_API_KEY` is set correctly in `.env`.

**Q: Score seems wrong for my repo?**
A: Scores are calculated from public GitHub API data only. Private repos, LFS files, and archived repos may show incomplete results.

**Q: Can I self-host the backend?**
A: Yes — replace the `fetch("https://api.anthropic.com/...")` call in `src/` with your own backend endpoint for production use.

## Feature Requests

Use the [Feature Request template](https://github.com/HandInstance/eliza-security-agent/issues/new?template=feature_request.md) to suggest improvements.

## License

Eliza Security Agent is [MIT licensed](./LICENSE). Commercial use is permitted.

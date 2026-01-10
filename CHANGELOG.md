# Changelog

All notable changes to Misaki Repository Intelligence are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.0] - 2026-04-28

### Changed
- Complete rebrand from Eliza Security Agent to Misaki Repository Intelligence
- Token ticker updated from $ELIZAOX to $MISAKI
- Badge logo updated from EZ to MK
- All internal references, variable names, and UI text updated
- Repository renamed to misaki-repository-intelligence
- Homepage updated to misakiintel.tech
- Version bumped to 2.0.0

## [1.1.0] - 2026-04-26

### Added
- GitHub Actions CI/CD workflow with automated build checks
- Issue templates for bug reports and feature requests
- Dependabot configuration for automated dependency updates
- FUNDING.yml for GitHub Sponsors support
- SECURITY.md with responsible disclosure policy
- SUPPORT.md with community support channels
- CONTRIBUTING.md with development guidelines
- `.prettierrc` and `.editorconfig` for code consistency

### Changed
- Refactored src/ into modular component structure
- Improved error handling on GitHub API rate limit (429)
- Optimized parallel API calls with Promise.all

### Fixed
- Branding inconsistency: replaced "Ask Samara" with "Ask Eliza"
- Badge colors updated to consistent black style

## [1.0.0] - 2026-04-23

### Added
- Initial release of Misaki Repository Intelligence
- 3-panel intelligence layout (File Tree / Code Viewer / AI Analysis)
- Trust Score: composite 0-100 across 6 dimensions
- Real-time GitHub API integration (no auth required)
- Commit DNA analysis with anomaly detection
- Live security scanner with severity-ranked findings
- Compare mode: side-by-side dual-repo intelligence
- Author Intel: cross-repo developer identity profiling
- Ask Misaki: AI chat powered by Anthropic Claude API
- Proof of Scan Badge: embeddable SVG with scan ID
- CT Thread export: one-click formatted Twitter/X thread
- Share modal with badge, embed, and thread options
- Landing page with feature grid and stats
- MIT License
# Contributing to Eliza Security Agent

Thank you for your interest in contributing to Eliza Security Agent! This project aims to provide comprehensive GitHub repository intelligence and trust verification.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/HandInstance/eliza-security-agent.git
   cd eliza-security-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Base UI elements (Icons, Badge, etc.)
│   ├── analysis/        # Analysis-specific components
│   └── panels/          # Panel components
├── views/               # Page-level view components
├── lib/                 # Utility functions and logic
│   ├── github.ts        # GitHub API integration
│   ├── scoring.ts      # Trust score calculations
│   └── constants.ts    # Design tokens and constants
├── hooks/              # Custom React hooks
└── data/               # Mock data for development
```

## Code Style

- **TypeScript**: All new code must be written in TypeScript
- **Naming**: Use PascalCase for components, camelCase for functions/variables
- **Imports**: Group imports: React → internal → external
- **Styling**: Use Tailwind CSS utility classes, avoid inline styles when possible
- **Colors**: Use CSS variables from `lib/constants.ts`

## Git Commit Convention

We follow a modified Conventional Commits format:

```
<type>: <short description>

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvement
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add compare mode for side-by-side repo analysis
fix: handle rate limit errors from GitHub API
refactor: extract scoring logic into separate module
docs: update README with new features
```

## Pull Request Process

1. **Fork and branch**: Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**: Follow the code style guidelines

3. **Test locally**: Ensure `npm run build` completes without errors

4. **Commit**: Use descriptive commit messages following our convention

5. **Push and PR**: Push to your fork and open a Pull Request

6. **Review**: Await code review feedback

## Reporting Issues

- Use the [Bug Report template](./.github/ISSUE_TEMPLATE/bug_report.md)
- Include steps to reproduce
- Add screenshots if applicable
- Specify your environment (OS, Node version)

## Feature Requests

- Use the [Feature Request template](./.github/ISSUE_TEMPLATE/feature_request.md)
- Describe the problem you're solving
- Propose a solution
- Consider backward compatibility

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for any questions about contributing.

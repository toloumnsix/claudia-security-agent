# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ Yes    |
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability, please report it responsibly:

**Email:** security@eliza-security.io
**Response time:** Within 48 hours
**Resolution target:** Within 7 days for critical issues

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (optional)

### What to Expect

1. Acknowledgement within 48 hours
2. Status update within 5 business days
3. Credit in CHANGELOG.md upon fix (if desired)

## Security Best Practices

When deploying Eliza Security Agent:

- Store `VITE_ANTHROPIC_API_KEY` in environment variables only
- Never commit `.env` files to version control
- Use `VITE_GITHUB_TOKEN` with minimal required scopes (`public_repo` only)
- Rotate API keys regularly

## Known Security Considerations

- GitHub API calls are made client-side — use a backend proxy in production
- Anthropic API key is exposed in browser if using `VITE_` prefix — consider a serverless function wrapper for production deployments

## Acknowledgements

We thank all security researchers who responsibly disclose vulnerabilities.

# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue.**

Please use GitHub's private vulnerability reporting feature:
https://github.com/yasu/finprecise/security/advisories/new

We will acknowledge receipt within 48 hours and aim to provide a fix within 7 days for critical issues.

## Scope

This library performs financial calculations and does not handle:
- Authentication or authorization
- Network requests
- File system access
- User input (inputs are expected to be validated by the caller)

However, we take the following seriously:
- **Calculation correctness**: Incorrect financial calculations can cause real financial harm
- **Denial of service**: Inputs that cause excessive computation or memory usage
- **Supply chain**: We maintain minimal dependencies and use npm provenance

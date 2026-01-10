name: Bug Report
description: File a bug report to help us improve
title: "[Bug] "
labels: ["bug", "needs-triage"]
assignees: [HandInstance]
body:
  - type: markdown
    attributes:
      value: |
        ## Bug Description
        Please describe the bug clearly.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Detailed description of the bug
      placeholder: Describe what happened vs what should have happened
    validations:
      required: true

  - type: input
    id: reproduction
    attributes:
      label: Reproduction URL
      description: Link to the repository you were scanning (if applicable)
      placeholder: https://github.com/owner/repo
    validations:
      required: false

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: List the exact steps to reproduce the bug
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What did you expect to happen?
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened?
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How severe is this bug?
      options:
        - Low - Minor cosmetic issue
        - Medium - Feature not working as expected
        - High - Core functionality broken
        - Critical - Application unusable
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: Version
      description: Application version
      placeholder: e.g., v1.0.0
    validations:
      required: false

  - type: input
    id: browser
    attributes:
      label: Browser
      description: Browser and version used
      placeholder: e.g., Chrome 120.0
    validations:
      required: false

  - type: checkboxes
    id: logs
    attributes:
      label: Relevant Logs
      description: Include any error messages or logs
      options:
        - label: I have included console error logs
          required: false
        - label: I have included network request logs
          required: false

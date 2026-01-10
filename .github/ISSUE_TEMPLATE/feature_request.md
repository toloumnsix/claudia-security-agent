name: Feature Request
description: Suggest a new feature or improvement
title: "[Feature] "
labels: ["enhancement", "needs-triage"]
assignees: [HandInstance]
body:
  - type: markdown
    attributes:
      value: |
        ## Feature Summary
        Briefly describe the feature you're requesting.

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: What problem does this feature solve?
      placeholder: Describe the user pain point or gap in functionality
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: How should this feature work?
      placeholder: Describe the expected behavior
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Any alternative approaches you've considered?
      placeholder: List any workarounds or alternative solutions
    validations:
      required: false

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      description: How important is this feature?
      options:
        - Low - Nice to have, no rush
        - Medium - Would improve user experience
        - High - Significant impact on functionality
        - Critical - Must have for production
    validations:
      required: true

  - type: dropdown
    id: complexity
    attributes:
      label: Complexity
      description: How complex is this feature to implement?
      options:
        - Low - Simple, isolated change
        - Medium - Moderate effort, may affect multiple areas
        - High - Significant refactoring required
        - Unknown - Need more investigation
    validations:
      required: true

  - type: checkboxes
    id: requirements
    attributes:
      label: Requirements
      description: Any specific requirements or constraints?
      options:
        - label: Must maintain backward compatibility
          required: false
        - label: Should work on mobile devices
          required: false
        - label: Needs API documentation
          required: false
        - label: Requires user testing
          required: false

  - type: textarea
    id: mockup
    attributes:
      label: Mockups / Wireframes
      description: Links to any mockups, wireframes, or designs
      placeholder: Attach or link to visual designs
    validations:
      required: false

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other relevant information
      placeholder: Include any other context that might be helpful
    validations:
      required: false

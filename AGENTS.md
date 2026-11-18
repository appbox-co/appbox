# AGENTS.md

## Feature work is tracked in a GitHub project

- Before starting, say whether you think the work is a feature (more than one
  pull request, or more than one repository) and get the user's answer. Do
  not classify it yourself.
- For a feature, create a private project in the `appbox-co` organisation by
  copying the template, and keep it private:
  `gh project copy 2 --source-owner appbox-co --target-owner appbox-co --title "<feature>"`.
  If the feature already has a project, use that one.
- Add one item per piece of work, across every repository the feature
  touches, and set its Area. Issues and pull requests are added as items.
  Work without a pull request (a migration to apply, a decision, a follow-up)
  goes in as a draft item; open an issue only when the work is handed to
  someone else.
- Keep each item's status current: Todo, In progress, In review, Done. An
  item is Done when its pull request is merged and the verification result is
  in the pull request body, or, without a pull request, when the work is
  completed and checked.
- Work that is deferred or found along the way becomes an item, not only a
  line in a pull request or a chat.
- Every pull request for the feature links the project.

## A change is not done until it is verified

- Run the `verify` skill (`.claude/skills/verify/SKILL.md`) after any change
  that alters behaviour, before saying it works and before a pull request is
  merged.
- This repository has no test framework: lint and build, then look at the
  changed page signed in, in a browser, against a non-production API.
- The pull request body says what was run, the result, the code that was
  under test, and what was not checked. A check that did not run is not a
  pass.
- Do not edit a test or a check in the same change to make it pass. No skips,
  sleeps or retries to quiet a failing check.
- Never test against production hosts or data.

---
name: verify
description: Verify a frontend (dashboard and website) change before calling it done - lint and build, then the change on staging, looked at signed in, in a browser. Use after any code change in this repository, before saying a fix works, and before a pull request is merged into main.
---

# Verify a frontend change

This repository has no test framework, so nothing here proves a page works
except loading it. "Done" means the changed page was seen working, signed in,
against a real API.

## 1. Cheap checks, on every change

- `pnpm lint` and `pnpm build` (the pre-commit hook runs the build too).
- `pnpm dev` talks to the **production** API unless told otherwise
  (`apps/web/src/api/client.ts`). Do not click through write actions on a
  local dev server; use staging for anything that changes data.

## 2. On staging

Use the team's staging skill and follow its deploy reference for this
repository (production branch `main`). The staging image takes a few minutes
to rebuild: wait for it and confirm that staging runs the commit under
review.

1. Run the staging journey suite: the API the dashboard depends on still
   behaves.
2. Open the staging dashboard in a browser, signed in as the test customer.
   Ask the user to enter the password; never type a password yourself. Walk
   the changed page and the pages that share its components. Check the
   console for errors and the network panel for failed requests.
3. Check an existing account with data, not only an empty one, and a narrow
   viewport if layout changed.

The admin panel is not in the staging build: say when a change to it could
not be checked.

## 3. Report

Say which pages were looked at, signed in as whom, at which commit, and what
was not checked. A screenshot of the changed page is worth attaching. A
passing lint and build is not a verification.

## 4. Feedback on the process

When verification got in your way for a reason other than your change, record
it in the private "Verification feedback" project, so the process gets fixed
instead of worked around again:

```bash
gh project item-create 8 --owner appbox-co --title "<one line>" \
  --body "<what you were verifying, what got in the way, the command and its output, what you did instead>"
```

File an item when a check failed for a reason other than the change, when
something could not run, when an instruction here was unclear or wrong, or
when a step was too slow to use. Nothing to file when it simply worked.

The item is in addition to your report, never instead of it: a verification
that could not run is still reported as not verified.

## Rules

- Never test against production. Never sign in with a real customer account.
- If the API and the page disagree about a field, find which is right before
  changing either.

# Project skills

These skills are vendored so a clean GitHub Actions runner has them in the
checkout, without an install step that depends on the network. OpenCode
discovers `.opencode/skills/<id>/SKILL.md` automatically.

| Skill | Why it is here |
| --- | --- |
| `to-spec` | Requested by the workflow requirement. Turns a conversation into a spec. |
| `to-tickets` | Requested by the workflow requirement. Breaks a spec into tracer-bullet tickets. |
| `implement-spec` | Requested by the workflow requirement. Implements a spec through its tickets. |
| `tdd` | `implement-spec` calls it for every implementer subagent. |
| `code-review` | `implement-spec` calls it before the integration branch is reported. |
| `codebase-design` | `tdd` consults it when the shape of a module or seam is in question. |

## Source

- Upstream: <https://github.com/mattpocock/skills>
- Commit: `5863806dd4e15c63174bee4e7515a4256792ecfa`
- Path: `skills/engineering/<id>`
- License: MIT, copyright Matt Pocock (see the upstream `LICENSE`).

The tracker, triage label and domain conventions these skills expect are in
`docs/agents/` and `GLOSSARY.md`.

## Updating

Copy the upstream `skills/engineering/<id>` directory over the local one, update
the commit above, and run `skills-smoke` manually. The smoke workflow loads each
requested skill through the `skill` tool and fails if the project copy is not the
one that gets loaded.

On a developer machine that also has the same skills installed globally, the
global copy can win over the project copy. `skills-smoke` runs on a clean runner
with no global skills, so it checks the case that matters for CI. To test the
project copy locally, isolate `HOME` or remove the global copy for the run.

Do not edit a vendored `SKILL.md` in place: the next update would overwrite it.
Put project-specific rules in `AGENTS.md`, `REVIEW.md` or `docs/agents/` instead.

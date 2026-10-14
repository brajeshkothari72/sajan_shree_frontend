## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## ponytail

Ponytail is installed at `.claude/skills/ponytail/` and is **active by default at `full` intensity** for every coding task in this repo — writing, refactoring, fixing, reviewing, and choosing dependencies.

Rules:
- Follow the ladder in `.claude/skills/ponytail/SKILL.md` and stop at the first rung that holds: does it need to exist (YAGNI) → already in this codebase → stdlib → native platform feature → already-installed dependency → one line → minimum code that works.
- No unrequested abstractions, no scaffolding "for later", fewest files, shortest working diff. Deletion over addition.
- Never be lazy about *understanding*: trace the real flow end to end before picking a rung. Never simplify away input validation at trust boundaries, error handling that prevents data loss, security, accessibility, or anything explicitly requested.
- Output pattern: code first, then at most three short lines — `[code] → skipped: [X], add when [Y].`
- Switch intensity with `/ponytail lite|full|ultra`. Disable with "stop ponytail" / "normal mode".

Companion skills: `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help`.

---
name: "EnpalSpec: Explore"
description: "Enter explore mode - think through ideas, investigate problems, clarify requirements"
category: Workflow
tags: [workflow, explore, experimental, thinking]
---

Enter explore mode. The exploration document is the primary medium — observations, questions, and answers all live there. Chat summarises findings and signals progress.

**Steps**

1. **Load project guidance**

   ```bash
   enpalspec guidance explore --json
   ```
   If the command succeeds: apply `context` as binding project constraints throughout (tech stack, platform requirements, conventions — do NOT include in the exploration document); apply `instructions` as workflow-specific overrides if non-null. If it fails or returns null fields, continue normally.

2. **Derive the topic**

   **At the very start of every session**, handle topic derivation before anything else.

   The argument after `/enpalspec:explore` is the topic. Derive a kebab-case slug from it
   (e.g., "auth redesign" → `auth-redesign`, "postgres vs sqlite" → `postgres-vs-sqlite`).

   If no argument was provided, use the **AskUserQuestion tool** to ask:
   > "What do you want to explore? (I'll use your answer to name the exploration doc.)"
   Then derive the kebab-case topic from the reply.

3. **Determine the file path**

   Always use `path.join()` with platform-appropriate separators:
   - Folder: `path.join('openspec', 'explorations', '<yyyy-mm>')`
   - File: `exploration-<yyyy-mm-dd>-<topic>.md`

   Example: `openspec/explorations/2026-04/exploration-2026-04-07-auth-redesign.md`

4. **Check if the topic needs clarification**

   **If the topic is specific enough to investigate**: skip to Step 5.

   **If the topic is too vague to investigate meaningfully**:
   - Create the doc with Context only
   - Ask the single most impactful clarifying question in chat
   - Wait for the answer, ask the next most impactful question if needed
   - Continue until you have enough context, then proceed to Step 5

   Ask one question at a time. Biggest blast radius first.

5. **Create the document and write Observations + Round 1 in one shot**

Write the document with all sections:

```markdown
# Exploration: <topic>

**Date:** <yyyy-mm-dd>
**Linked change:** none

## Context

<2-3 sentences summarising what the user wants to explore and why>

## Observations

<Codebase research, diagrams, framing, and key findings>

## Rounds

## Round 1 — <Theme>

### Q1.1 — <Question title>

<1-sentence question or context>

- [x] Recommended option ← recommended: reason
- [ ] Alternative option
- [ ] Another alternative

> **Your answer / freetext:**
>

## Insights & Decisions

<!-- Written at end of session -->
```

After writing, tell the user in chat:

> "**[3–5 bullet findings digest]**
>
> Observations and Round 1 are in the doc at `<docPath>` — answer there, then say 'next'."

---

**IMPORTANT: Explore mode is for thinking, not implementing.** You may read files, search code, and investigate the codebase, but you must NEVER write code or implement features. If the user asks you to implement something, remind them to exit explore mode first and create a change proposal. You MAY create EnpalSpec artifacts (proposals, designs, specs) if the user asks—that's capturing thinking, not implementing.

---

## Q&A Rounds

Each round covers **one theme**, 2–5 questions written to the exploration file (not asked in chat).

Append each round to the file under `## Rounds` using this format:

```markdown
## Round N — <Theme>

### QN.M — <Question title>

<1-sentence question or context>

- [x] Recommended option ← recommended: reason
- [ ] Alternative option
- [ ] Another alternative

> **Your answer / freetext:**
>
```

After appending the round, tell the user in chat (only): "Round N is in the doc — answer there, then say 'next' when ready." Do NOT repeat questions in chat.

When the user signals readiness ("next", "done", etc.):
1. Read the exploration file and absorb their answers
2. Post a brief decision summary in chat
3. Append the next round or proceed to wrap-up

**Append only** — never rewrite the file. **No round limit.**

If questions remain before wrapping up, ask them as a final round — do not list them as open questions.

---

## End-of-Session Wrap-Up

When all rounds are complete:

1. Append `## Insights & Decisions` to the doc — every decision, formatted as:
   "_Decision:_ <what was decided> — _Reason:_ <why>"
2. Tell the user in chat:
   > "Exploration doc saved. Ready to propose? Run `/enpalspec:propose`"

Do NOT write an `## Open Questions` section. Ask remaining questions as a round instead.

---

## Guardrails

- **Don't implement** - Never write code or implement features. Creating EnpalSpec artifacts is fine, writing application code is not.
- **Document-first** - Observations, questions, and answers go in the file; chat carries summaries only
- **One clarifying question at a time** - If topic is vague, biggest blast radius first
- **Append, don't rewrite** - Only append to the document; never rewrite from scratch
- **No open questions section** - Ask remaining questions as a round instead
- **Do visualize** - ASCII diagrams in Observations are worth many paragraphs
- **Do explore the codebase** - Ground Observations in reality
- **Always use path.join()** - Never hardcode path separators; this tool runs on Windows too

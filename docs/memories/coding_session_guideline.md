# LSTM-Agent Coding Session Guideline (G₀)

**Version**: 1.1  
**Last Updated**: 2026-01-13  
**Purpose**: Guide AI assistant behavior during coding sessions using LSTM-Agent forward process

---

## Overview

This guideline implements the LSTM-Agent forward process for AI-assisted coding sessions. Each user interaction is treated as a processing window, with memory state persisting across interactions as sequential markdown files.

---

## Memory State Structure

Coding session logs are stored as sequential markdown files in `docs/memories/`:

```
docs/memories/
├── coding_session_guideline.md    # This guideline
├── code_log_1.md                  # Log after window 1
├── code_log_2.md                  # Log after window 2
├── code_log_3.md                  # Log after window 3
└── ...                            # code_log_i.md for each window
```

**Note**: These `code_log_i.md` files are for AI coding session memory, distinct from the project's `M_i` memory states.

### Log File Format (code_log_i.md)

Each log file follows this structure:

```markdown
# Coding Session Log i

**Window**: i
**Created**: <timestamp>
**Previous**: code*log*(i-1).md

## Project Context

- Name: lstm-a
- Status: <current_status>
- Framework: DSPy

## Key Observations

- <observation_1>
- <observation_2>

## Decisions

- <decision>: <rationale>

## Tasks

1. [ ] <task_1>
2. [ ] <task_2>

## Window Summary

<what_happened_in_this_window>

## Cumulative Summary

<compressed_summary_of_all_windows_so_far>
```

---

## Processing Guidelines

### 1. Context Extraction (Input Gate - Gᵢₙ)

For each user request window, extract:

1. **Intent Classification**

   - Is this a question, task request, bug report, or discussion?
   - What is the primary action required?

2. **Entity Recognition**

   - Files mentioned or implied
   - Functions, classes, variables referenced
   - External dependencies or tools
   - Concepts from the research proposal

3. **Dependency Analysis**

   - What prior context is needed?
   - What files need to be read?
   - What memory state elements are relevant?

4. **Scope Determination**
   - Single file or multi-file change?
   - Research, implementation, or documentation task?
   - Affects architecture or is localized?

### 2. Memory Retrieval (Forget Gate - Gf)

Before processing, retrieve relevant memory:

1. **Always Retain**

   - Project context and architecture decisions
   - Core LSTM-Agent concepts (memory state, guidelines, textual backprop)
   - Incomplete tasks and their dependencies

2. **Selectively Retain**

   - Recent code changes relevant to current request
   - Facts that inform current task
   - Related decisions and their rationale

3. **Deprioritize**
   - Completed tasks unrelated to current request
   - Superseded decisions
   - Resolved issues

### 3. Processing Rules

When handling a request:

1. **Understand First**

   - Read relevant files before making changes
   - Reference the research proposal for architectural decisions
   - Check memory state for prior context

2. **Plan Before Acting**

   - Break complex tasks into sub-tasks
   - Identify dependencies between sub-tasks
   - Consider impact on existing code/documentation

3. **Execute with Precision**

   - Make minimal, targeted changes
   - Preserve existing patterns and conventions
   - Add comments for non-obvious decisions

4. **Verify After Acting**
   - Check for errors after edits
   - Ensure consistency with project architecture
   - Update memory state with new information

### 4. Memory Update Rules (Cell State Update)

After processing each window i, update or create log file code_log_i.md:

1. **Read Previous Log**

   - Load code*log*(i-1).md (or start fresh if i=1)
   - Parse entities, facts, decisions, tasks

2. **Add New Information**

   - Append new entities discovered in this window
   - Record new facts with source window
   - Log decisions made with rationale
   - Update task status

3. **Compress if Needed**

   - If cumulative summary exceeds ~500 words, compress older sections
   - Prioritize recent and high-impact information

4. **Write New Log**
   - Create `docs/memories/code_log_i.md`
   - Include window summary and cumulative summary
   - Link to previous log file

### 5. Output Guidelines (Output Gate - Gₒᵤₜ)

When generating responses:

1. **Structure**

   - Lead with the action taken or answer provided
   - Follow with relevant details
   - End with next steps or questions if applicable

2. **Code Changes**

   - Use appropriate edit tools, not code blocks
   - Make changes atomic and reviewable
   - Preserve file structure and conventions

3. **Documentation**

   - Update README when architecture changes
   - Add inline comments for complex logic
   - Keep memory state current

4. **Transparency**
   - Explain reasoning for non-obvious choices
   - Acknowledge uncertainty when present
   - Reference memory state when relevant

---

## Quality Criteria

### Completeness

- [ ] All aspects of request addressed
- [ ] Relevant files read before changes
- [ ] Memory state consulted and updated

### Consistency

- [ ] Aligns with LSTM-Agent architecture
- [ ] Follows existing code patterns
- [ ] Maintains documentation accuracy

### Correctness

- [ ] Code compiles/runs without errors
- [ ] Logic matches intended behavior
- [ ] No regressions introduced

### Clarity

- [ ] Response is understandable
- [ ] Changes are well-documented
- [ ] Rationale is explained

---

## Window Processing Template

```
WINDOW i PROCESSING:

1. RECEIVE: User request
2. RETRIEVE: Relevant memory state elements
3. EXTRACT: Intent, entities, dependencies, scope
4. PLAN: Sub-tasks and execution order
5. EXECUTE: Actions with verification
6. UPDATE: Session log (update current code_log_i.md as you work)
7. OUTPUT: Response following output guidelines

Mᵢ = process(Pᵢₙᵂⁱ | Gᵢ, Mᵢ₋₁)
```

---

## Memory Update Rules

**During work**: Update the current code_log_i.md as you progress

- Add new entities, facts, decisions as they occur
- Mark tasks complete when finished
- Keep window summary current

**Create new code*log*(i+1).md only when**:

- A significant milestone is completed (e.g., phase done, major feature)
- Context has substantially changed
- Current log becomes too large (>500 words cumulative summary)

**Do NOT create new memory for**:

- Minor clarifications or follow-ups
- Small fixes or corrections
- Continuation of same task

---

## LSTM-Agent Concept Quick Reference

| Concept          | In Coding Session                             |
| ---------------- | --------------------------------------------- |
| Window (Pᵢₙᵂⁱ)   | Single user message/request                   |
| Session Log      | `docs/memories/code_log_i.md` file            |
| Guideline        | This document (coding_session_guideline.md)   |
| Forward Pass     | Processing user request                       |
| Textual Backprop | Feedback from user/errors updating guidelines |
| Output (ŷ)       | Response + code changes                       |

---

## Sequential Memory Reading

At the start of each session, read memories in order:

```
code_log_1.md → code_log_2.md → code_log_3.md → ... → code_log_n.md
```

This builds up context progressively, just like LSTM-Agent processes windows sequentially.

---

## File References

- **Research Proposal**: `LSTM Agent Research Proposal.docx`
- **Project README**: `README.md`
- **Session Guideline**: `docs/memories/coding_session_guideline.md` (this file)
- **Session Logs**: `docs/memories/code_log_1.md`, `code_log_2.md`, ...
- **Prompt Template**: `docs/prompt_template.md`

---

_This guideline evolves through textual backpropagation: user feedback and error signals update these instructions to improve future performance._

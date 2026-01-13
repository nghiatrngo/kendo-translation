# Documentation Maintenance Guideline

**Purpose**: Standard process for adding, updating, and removing project documentation  
**Last Updated**: January 13, 2025

---

## Quick Reference

| Action     | Steps                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------- |
| **Add**    | 1. Create file → 2. Add to INDEX.md → 3. Cross-link from related docs → 4. Commit                  |
| **Update** | 1. Review current state → 2. Compare with code → 3. Update content → 4. Update date → 5. Commit    |
| **Remove** | 1. Check for links → 2. Update INDEX.md → 3. Remove cross-links → 4. Archive or delete → 5. Commit |

---

## Documentation Structure

```
docs/
├── INDEX.md           # Master index (update on add/remove)
├── API.md             # Endpoint documentation
├── ARCHITECTURE.md    # System design, routes, components
├── CHANGELOG.md       # Version history (update on release)
├── DEPLOYMENT.md      # Production deployment
├── DEVELOPER_GUIDE.md # Setup and contribution
├── TESTING.md         # Testing strategy
├── USER_TUTORIAL.md   # End-user guide
├── NEXT_STEPS.md      # Roadmap and priorities
├── debug_progress.md  # Issue tracking (internal)
└── ai_docs/           # AI coder artifacts (internal)
    └── archive/       # Historical files
```

---

## Update Checklist

When making changes to the codebase, update docs in this order:

### 1. API Changes

- [ ] Update `API.md` with new/modified endpoints
- [ ] Include request/response examples
- [ ] Note authentication requirements

### 2. Architecture Changes

- [ ] Update `ARCHITECTURE.md` routes table
- [ ] Update components table
- [ ] Update database schema section

### 3. New Features

- [ ] Add entry to `CHANGELOG.md` under current version
- [ ] Update `NEXT_STEPS.md` to reflect completion
- [ ] Update `USER_TUTORIAL.md` if user-facing

### 4. Developer-Facing Changes

- [ ] Update `DEVELOPER_GUIDE.md` project structure
- [ ] Add code patterns/examples if new patterns introduced
- [ ] Update `TESTING.md` if new test procedures needed

### 5. Always

- [ ] Update "Last Updated" date at bottom of each file
- [ ] Update `INDEX.md` if new files added
- [ ] Commit with descriptive message

---

## Commit Message Format

```
docs: Brief description of changes

- File1.md: What changed
- File2.md: What changed
```

Example:

```
docs: Add MAC-RAG endpoints and update architecture

- API.md: Added /api/translate/mac-rag, /api/context/retrieve
- ARCHITECTURE.md: Added MAC-RAG routes and components
- CHANGELOG.md: Added v0.5.0 entry
```

---

## Cross-Linking Rules

1. **INDEX.md** must link to all public docs
2. **DEVELOPER_GUIDE.md** should link to API.md for endpoint details
3. **USER_TUTORIAL.md** should NOT link to technical docs
4. Use relative paths: `[API Reference](API.md)`

---

## Version Updates (CHANGELOG.md)

When adding a new version:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New features

### Changed

- Modifications to existing features

### Fixed

- Bug fixes

### Removed

- Deprecated features removed
```

---

## Archiving vs Deleting

| Content Type           | Action                           |
| ---------------------- | -------------------------------- |
| Outdated internal docs | Move to `ai_docs/archive/`       |
| Superseded public docs | Delete after updating references |
| Historical debug logs  | Keep in `debug_progress.md`      |

---

## Quality Checklist

Before committing documentation changes:

- [ ] All code blocks have language specifier (`typescript, `bash)
- [ ] Tables are properly formatted
- [ ] Links are valid (no broken references)
- [ ] "Last Updated" date is current
- [ ] No placeholder text remains
- [ ] Information matches actual implementation

---

## File Templates

### New Feature Doc

```markdown
# Feature Name

## Overview

Brief description.

## Usage

How to use the feature.

## API

Endpoints if applicable.

## Configuration

Settings and options.

---

_Last Updated: YYYY-MM-DD_
```

### Debug/Progress Doc

```markdown
# Feature/Issue Name

**Started**: Date
**Status**: In Progress / Complete

## Issue Description

What's being fixed or built.

## Changes Made

| File | Change |
| ---- | ------ |

## Verification

How to verify the fix/feature works.

---

_Last Updated: YYYY-MM-DD_
```

---

_This guideline should be updated when documentation structure changes._

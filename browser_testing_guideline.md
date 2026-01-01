# Browser Testing Guidelines for AI Coders

**Purpose**: Guidelines for AI agents to perform browser testing like a real human user  
**Key Principle**: Act like a human, not a test automation script  
**Last Updated**: December 31, 2024

---

## 🎯 Core Philosophy

**The goal is to simulate real user behavior**, not just check if elements exist.

```
❌ Wrong: Navigate → Check element → Close tab → Report
✅ Right: Navigate → Read content → Interact naturally → Observe → React → Report
```

---

## § Human-Like Testing Patterns

### 1. Session Persistence
**Keep the browser tab open throughout the entire test session.**

```
❌ Anti-Pattern:
- Open page A, test, close
- Open page B, test, close
- Open page C, test, close

✅ Human Pattern:
- Open page A
- Navigate to page B (via links/buttons in the app)
- Navigate to page C (via links/buttons in the app)
- Only close when session complete
```

### 2. Natural Navigation
**Use in-app navigation, not direct URL jumps.**

```
✅ Human behavior:
- Click on navigation links
- Use sidebar menus
- Follow breadcrumbs
- Click back button when needed

❌ Avoid:
- Opening fresh URLs for each page
- Bypassing normal navigation flow
```

### 3. Read Before Click
**Observe the page content before interacting.**

```
✅ Steps:
1. Wait for page to fully load (2-3 seconds)
2. Read visible text/headings
3. Identify interactive elements
4. Plan the interaction
5. Execute the click/input
6. Observe the result
```

### 4. Progressive Interaction
**Build up context through each step.**

| Step | Action | Purpose |
|------|--------|---------|
| 1 | View DOM/Page | Understand current state |
| 2 | Capture screenshot | Document initial state |
| 3 | Identify target | Find element to interact with |
| 4 | Click/Type | Perform action |
| 5 | Wait | Allow for response |
| 6 | Observe result | Verify outcome |
| 7 | Document | Screenshot or console log |

### 5. State Awareness
**Remember what you've done in the session.**

- Track login state
- Remember which articles you've viewed
- Note form data you've entered
- Be aware of navigation history

---

## § Test Session Structure

### Opening Sequence
```markdown
1. Navigate to application root
2. Capture initial screenshot
3. Identify current login state
4. If needed, perform login
5. Verify login success
6. Document session start
```

### Testing Sequence
```markdown
For each feature being tested:
1. Navigate to feature (via in-app links)
2. Wait for load (2-3 seconds)
3. Read the page content
4. Capture screenshot
5. Perform interactions
6. Verify expected behavior
7. Handle errors gracefully
8. Document results
```

### Closing Sequence
```markdown
1. Navigate back to home/dashboard
2. Perform logout (if applicable)
3. Capture final screenshot
4. Compile test report
5. Then close the browser
```

---

## § Interaction Timing

### Wait Durations
| Action | Wait Time |
|--------|-----------|
| Page navigation | 2-3 seconds |
| Form submission | 3-5 seconds |
| API-heavy operation | 5-8 seconds |
| File upload | 5-10 seconds |
| LLM response | 5-15 seconds |

### Human Reading Speed
- Allow 1-2 seconds to "read" headings
- Allow 2-3 seconds for longer content
- Don't immediately interact after page load

---

## § Error Handling

### On Error, Don't Abort
```
❌ Wrong: Error → Stop test → Report failure
✅ Right: Error → Capture error → Try recovery → Continue with rest
```

### Recovery Strategies
1. **Refresh current page** and retry
2. **Navigate back** and try different path
3. **Clear state** and restart from last checkpoint
4. **Document error** and continue to next test

### Error Documentation
```markdown
When an error occurs, capture:
1. Screenshot of error state
2. Console logs
3. Network requests (if relevant)
4. Steps that led to error
5. Recovery attempt and result
```

---

## § Screenshot Strategy

### When to Capture
| Situation | Screenshot Required |
|-----------|---------------------|
| Page first loads | ✅ |
| After user interaction | ✅ |
| Before form submission | ✅ |
| After successful action | ✅ |
| On error | ✅ |
| Between phases | ✅ |

### Naming Convention
```
[feature]_[action]_[state].png
Examples:
- login_form_initial.png
- translate_suggestion_loaded.png
- macrag_phase2_candidates.png
```

---

## § Multi-Phase Testing Pattern

For complex features with multiple phases (like MAC-RAG):

```markdown
Phase 1: Setup
- Navigate to feature
- Verify initial state
- Configure if needed
- Screenshot initial state

Phase 2: Execution
- Perform main action
- Wait for processing
- Observe intermediate states
- Screenshot each state change

Phase 3: Verification
- Verify expected outcomes
- Check error states
- Validate data persistence
- Screenshot final state

Phase 4: Cleanup
- Reset state if needed
- Logout if applicable
- Final screenshot
- Compile report
```

---

## § Test Reports

### Success Report Format
```markdown
## ✅ Browser Test: [Feature Name]

**Session Duration**: X minutes
**Steps Completed**: N/M

### Summary
- [Feature 1]: ✅ Working
- [Feature 2]: ✅ Working

### Screenshots
- [Step 1 screenshot]
- [Result screenshot]

### Notes
- Any observations or minor issues
```

### Failure Report Format
```markdown
## ❌ Browser Test: [Feature Name]

**Failed At**: [Step description]
**Error**: [Error message]

### Steps Before Failure
1. Step 1 - ✅
2. Step 2 - ✅
3. Step 3 - ❌ (failed here)

### Error Evidence
- Screenshot
- Console logs
- Network errors

### Recovery Attempted
- What was tried
- Result
```

---

## § Anti-Patterns to Avoid

❌ Opening new tabs for each page  
❌ Testing without reading content first  
❌ Clicking immediately after navigation  
❌ Ignoring loading states  
❌ Not capturing screenshots  
❌ Stopping on first error  
❌ Using direct URL navigation instead of clicking  
❌ Not maintaining session context  
❌ Testing in isolation without flow  
❌ Rushing through interactions  

---

## § Quick Reference Checklist

Before starting:
- [ ] Identify pages to test
- [ ] Plan navigation flow (via clicks, not URLs)
- [ ] Prepare test credentials

During testing:
- [ ] Wait after each navigation
- [ ] Read content before interacting
- [ ] Screenshot key states
- [ ] Capture console logs on errors
- [ ] Stay in same tab when possible

After testing:
- [ ] Logout properly
- [ ] Compile test report
- [ ] Include screenshots
- [ ] Document any issues

---

**Summary Philosophy:**
> Act like a human | Stay in session | Navigate naturally | Observe before acting | Document everything

---

*Guidelines created: December 31, 2024*

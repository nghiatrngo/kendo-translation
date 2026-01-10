
# MAC-RAG Enhancements Verification

This walkthrough guides you through verifying the new features: Literal Context, Customizable Prompts, and Persistent Logs.

## 1. Literal Context
**Goal**: Verify that special instructions are passed to the translator.

1.  Navigate to a translation page (e.g., `/translate/mac-rag/[article-id]`).
2.  In **Phase 1 (Context)**, look for the **"Special Instructions (Literal Context)"** text area.
3.  Enter a distinctive instruction, e.g., `Translate this into Pirate English (Ahoy matey!)`.
4.  Click **Start Translation** or **Next**.
5.  In **Phase 2**, verify the translation candidates reflect the instruction (e.g., look for "Ahoy", "Yer", etc.).
6.  (Optional) Check **Agent Logs** to see if the system prompt included "SPECIAL INSTRUCTIONS".

## 2. Customizable Prompts
**Goal**: Verify that you can modify agent prompts and they persist.

1.  In the translation page, scroll down to the **Agent Config / Logs** panel.
2.  Click the **⚙️ Agent Config** tab.
3.  Click the **Prompts** toggle (top right of the panel).
4.  Click **✏️ Edit Prompts**.
5.  Add a custom prompt for `translation` agent. Example JSON:
    ```json
    [
      {
        "agentType": "translation",
        "approach": "natural",
        "template": "You are a poetic translator. Translate everything as a haiku."
      }
    ]
    ```
6.  Click **💾 Save Changes**.
7.  Run a translation (Phase 2).
8.  Verify the output matches the new prompt (e.g., is it a haiku?).
9.  Refresh the page. Go back to Config > Prompts. Verify your custom prompt is still there (Persistence).

## 3. Persistent Logs
**Goal**: Verify that agent conversation history is saved to the database.

1.  Perform some translations or scoring actions.
2.  Go to the **💬 Agent Logs** tab.
3.  Verify you see the logs for the actions you just performed.
4.  **Restart the development server** (Ctrl+C, `npm run dev`).
5.  Refresh the browser page.
6.  Go to **💬 Agent Logs**.
7.  Verify that the **previous logs are still visible**. This confirms they are fetching from Supabase `agent_logs` table.

## Troubleshooting
- If logs don't appear after restart, check the browser console for API errors on `/api/agent/logs`.
- If prompt saving fails, ensure you are logged in as a user with write permissions (Translator role).

## 4. Verification Results & Fixes
- **Issue**: Initial test for "Save Prompt" failed with 500 Error.
  - **Cause**: Missing `createClient` import in `route.ts`.
  - **Fix**: Added missing import.
- **Final Result**:
  - **Literal Context**: Verified working.
  - **Prompt Saving**: Verified working (inc. persistence and reset).
  - **Logs**: Verified working (database persistence and display).

![Successful Agent Logs Display](/Users/nghiango-mbp/.gemini/antigravity/brain/69bbe779-cc1b-449a-b940-9aef13bfa5ed/.system_generated/click_feedback/click_feedback_1768042167296.png)

# ElevenLabs Integration Testing Instructions

## Quick Start Guide for Testing the Club Selection Modal

### Prerequisites
1. Ensure the dev server is running: `npm run dev`
2. Open browser DevTools (F12) and navigate to the Console tab
3. Clear console to see fresh logs

### Test URL
Navigate to: `http://localhost:3000/features#ai-selection`

The modal should open automatically when you load this URL.

### Test Scenarios

#### Test 1: Basic Skill Level Selection
1. Click on "Beginner" level
2. Expected console output:
   ```
   [AIClubSelectionModal] User selected skill level: Beginner
   ========================================
   [AIClubSelectionModal] DEBUG: Starting conversation
   [AIClubSelectionModal] Selected Level: Beginner
   [AIClubSelectionModal] Dynamic Variables being sent: {
     "golf_level": "Beginner"
   }
   ...
   ```

#### Test 2: All Skill Levels
Test each level individually:
- Beginner
- Intermediate
- Advanced
- Pro
- Tour Pro

For each level, verify the console shows the correct value in the dynamic variables.

#### Test 3: Connection Success Path
If the connection succeeds, you should see:
```
========================================
[AIClubSelectionModal] DEBUG: Conversation started successfully
[AIClubSelectionModal] Conversation status after startSession: connected
[AIClubSelectionModal] Variables transmitted: {
  "golf_level": "[Selected Level]"
}
========================================
[AIClubSelectionModal] Conversation connected
[AIClubSelectionModal] Connection status: connected
```

#### Test 4: Connection Error Path
If the connection fails, you should see:
```
========================================
[AIClubSelectionModal] CRITICAL ERROR: Failed to start conversation
[AIClubSelectionModal] Error object: [Error details]
[AIClubSelectionModal] Error type: [type]
[AIClubSelectionModal] Error constructor: [constructor name]
[AIClubSelectionModal] Error message: [message]
[AIClubSelectionModal] Error stack: [stack trace]
[AIClubSelectionModal] Selected level at error: [level]
[AIClubSelectionModal] Variables attempted: { golf_level: "[level]" }
========================================
```

### Key Information to Collect

When reporting results, please include:

1. **Connection Status**: Did the agent connect successfully?
2. **Error Messages**: Full error text if connection failed
3. **Variables Logged**: Copy the "Dynamic Variables being sent" output
4. **Network Activity**:
   - Open DevTools > Network tab
   - Filter for "WebSocket" or "WebRTC"
   - Check if any connections are established
5. **Agent Response**: Does the agent acknowledge the skill level in its responses?

### Common Issues to Look For

#### Issue 1: API Key Missing
**Symptom**: Connection fails with authentication error
**Fix**:
1. Get API key from https://elevenlabs.io/app/settings/api-keys
2. Add to `.env.local`: `NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_your_key_here`
3. Restart dev server: `npm run dev`

#### Issue 2: Agent Not Configured
**Symptom**: Connection succeeds but agent doesn't use the skill level
**Fix**: Check ElevenLabs dashboard > Agent settings > Dynamic Variables
- Verify a variable named "golf_level" exists
- Check the variable type matches (string)

#### Issue 3: Variable Name Mismatch
**Symptom**: Agent connects but asks for skill level instead of using it
**Troubleshooting**: The agent might expect a different variable name
**To Test**: Temporarily modify line 74 in AIClubSelectionModal.tsx:
```typescript
// Try different variable names:
const dynamicVariables = {
  skill_level: selectedLevel || 'Beginner',  // Instead of golf_level
};
```

### Network Debugging

To see the actual WebRTC/WebSocket data:
1. Open DevTools > Network tab
2. Look for connections to elevenlabs.io domains
3. Check the Headers/Payload tabs to see if variables are included
4. Look for WebRTC signaling messages

### Agent Response Verification

Once connected, speak to the agent and say:
> "What skill level am I?"

or

> "Tell me what level you have for me"

The agent should respond with the skill level you selected.

### Success Criteria

The integration is working correctly if:
1. ✅ Console shows variables being sent with correct skill level
2. ✅ No errors in console or UI
3. ✅ Agent connects successfully (shows "AI Agent Connected" screen)
4. ✅ Agent references the correct skill level in responses
5. ✅ Can have a full conversation with the agent

### Failure Indicators

Report these issues immediately:
- ❌ Console shows authentication errors
- ❌ Variables show as `undefined` or `null`
- ❌ Connection fails repeatedly
- ❌ Agent asks for skill level despite it being sent
- ❌ Agent provides recommendations inconsistent with skill level

### Advanced Debugging

If basic tests pass but you still suspect issues:

1. **Check Agent Logs** (requires ElevenLabs dashboard access):
   - Go to https://elevenlabs.io
   - Navigate to Conversational AI > Logs
   - Find your conversation
   - Check if the dynamic variable was received

2. **Test with Hardcoded Value**:
   Modify line 74 to always send "Advanced":
   ```typescript
   const dynamicVariables = {
     golf_level: 'Advanced'  // Hardcoded for testing
   };
   ```
   Then test with different UI selections to see if the hardcoded value works.

3. **Test with Multiple Variables**:
   Add additional variables to verify the format:
   ```typescript
   const dynamicVariables = {
     golf_level: selectedLevel || 'Beginner',
     test_var: 'Hello',
     user_type: 'tester'
   };
   ```

### Next Steps After Testing

Based on test results:

**If connection fails**:
→ Review error messages and check ElevenLabs dashboard for agent status

**If connection succeeds but variables don't work**:
→ Verify agent configuration in ElevenLabs dashboard
→ Test alternative variable names
→ Check agent prompt to see if it references the variable

**If everything works**:
→ Document the successful configuration
→ Test with multiple users/sessions
→ Monitor for any intermittent issues

### Getting Help

If issues persist:
1. Copy all console logs (use right-click > Save as... in Console tab)
2. Take screenshots of the UI state
3. Export network activity (Network tab > right-click > Save all as HAR)
4. Document the exact steps to reproduce
5. Share the ELEVENLABS_DEBUG_REPORT.md with findings

### File Locations

- Component: `C:\Users\scott\Claude_Code\caddyai\components\AIClubSelectionModal.tsx`
- Debug Report: `C:\Users\scott\Claude_Code\caddyai\ELEVENLABS_DEBUG_REPORT.md`
- Environment: `C:\Users\scott\Claude_Code\caddyai\.env.local`

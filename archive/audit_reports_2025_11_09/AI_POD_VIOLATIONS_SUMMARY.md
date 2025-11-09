# AI POD Violations - Quick Reference

## Summary Statistics
- Total Violations: 47
- Files Affected: 23
- Critical Violations: 8
- High Priority Violations: 15
- Medium Priority Violations: 18
- Low Priority Violations: 6

## Violation Breakdown by Category

| Category | Count | Severity | Status |
|----------|-------|----------|--------|
| Duplicate Gemini Adapters | 3 | CRITICAL | 🔴 |
| Direct Gemini Imports | 11 | HIGH | 🔴 |
| Scattered Prompts | 9 | HIGH | 🟡 |
| Duplicate Processing Logic | 8 | MEDIUM | 🟡 |
| Missing Config | 1 | CRITICAL | 🔴 |
| Missing Pipeline | 2 | MEDIUM | 🟡 |
| Archived Personas | 6 | MEDIUM | 🟡 |

## Critical Issues Requiring Immediate Action

### 🚨 P0 - CRITICAL
1. **Missing /ai_pod/config.mjs** - File doesn't exist, causing broken import
   - Location: Should be at `/home/user/aibradaa/ai_pod/config.mjs`
   - Impact: `/api/routes/camera.mjs:8` has broken import
   - Action: Restore from archive and modernize

2. **Triple Gemini Adapter Duplication**
   - `/netlify/functions/utils/gemini.mjs` (358 lines)
   - `/api/adapters/geminiAdapter.mjs` (114 lines)
   - `/ai_pod/adapters/gemini_v2_5_adapter.mjs` (412 lines) ✅ KEEP
   - Action: Delete first two, use ai_pod version

3. **Broken Import Chain**
   - `/api/routes/camera.mjs` importing non-existent config
   - Action: Fix import path or restore missing file

## Files to Delete (Duplicates)

```
❌ /home/user/aibradaa/api/adapters/geminiAdapter.mjs
❌ /home/user/aibradaa/netlify/functions/utils/gemini.mjs
```

## Files to Create

```
✨ /home/user/aibradaa/ai_pod/config.mjs (restore from archive)
✨ /home/user/aibradaa/ai_pod/adapters/response_parser.mjs
✨ /home/user/aibradaa/ai_pod/pipelines/inference_pipeline.mjs
✨ /home/user/aibradaa/ai_pod/personas/syeddy_command_v1.0.0.md
✨ /home/user/aibradaa/ai_pod/personas/matchmaker_v1.0.0.md
✨ /home/user/aibradaa/ai_pod/personas/intel_analyst_v1.0.0.md
✨ /home/user/aibradaa/ai_pod/personas/camera_vision_v1.0.0.md
✨ /home/user/aibradaa/ai_pod/personas/deck_v2_system_prompt.md
```

## Files to Update (Import Paths)

### Netlify Functions (6 files)
```
🔧 /home/user/aibradaa/netlify/functions/intel.mjs
🔧 /home/user/aibradaa/netlify/functions/chat.mjs
🔧 /home/user/aibradaa/netlify/functions/command.mjs
🔧 /home/user/aibradaa/netlify/functions/recommendations.mjs
🔧 /home/user/aibradaa/netlify/functions/camera.mjs
🔧 /home/user/aibradaa/netlify/functions/deck.mjs
```

### API Routes (4 files)
```
🔧 /home/user/aibradaa/api/routes/command.mjs
🔧 /home/user/aibradaa/api/routes/deck.mjs
🔧 /home/user/aibradaa/api/routes/camera.mjs
🔧 /home/user/aibradaa/api/sse/deck-stream.mjs
```

## Inline Prompts to Extract

| File | Line Range | Target Location |
|------|-----------|-----------------|
| `/netlify/functions/command.mjs` | 42-54 | `/ai_pod/personas/syeddy_command_v1.0.0.md` |
| `/netlify/functions/recommendations.mjs` | 76-100 | `/ai_pod/personas/matchmaker_v1.0.0.md` |
| `/netlify/functions/intel.mjs` | 92-101 | `/ai_pod/personas/intel_analyst_v1.0.0.md` |
| `/netlify/functions/camera.mjs` | 71-92 | `/ai_pod/personas/camera_vision_v1.0.0.md` |
| `/netlify/functions/deck.mjs` | 78-92 | `/ai_pod/personas/deck_v2_system_prompt.md` |
| `/api/routes/command.mjs` | 37-48 | Same as netlify version (DUPLICATE) |
| `/api/routes/deck.mjs` | 36-50 | Same as netlify version (DUPLICATE) |
| `/api/routes/camera.mjs` | 76-97 | Same as netlify version (DUPLICATE) |
| `/api/sse/deck-stream.mjs` | 40-52 | Same as netlify version (DUPLICATE) |

## Duplicate Logic to Consolidate

| Logic | Current Locations | Target Location |
|-------|------------------|-----------------|
| Token Estimation | 3 files | `/ai_pod/adapters/` (single impl) |
| Cost Calculation | 2 files | `/ai_pod/adapters/` (single impl) |
| JSON Parsing | 5 files | `/ai_pod/adapters/response_parser.mjs` |
| Intent Parsing | 2 files | `/ai_pod/personas/intent_classifier.mjs` |

## Migration Phases

### Week 1
- **Day 1**: Restore config.mjs, fix broken import
- **Day 2-3**: Centralize adapters, update imports
- **Day 4-5**: Extract prompts to ai_pod/personas

### Week 2
- **Day 6**: Consolidate response processing
- **Day 7-8**: Create inference pipeline
- **Day 9**: Migrate configuration
- **Day 10**: Final validation & testing

## Compliance Score

Current: **30%** ❌  
Target: **100%** ✅

### Breakdown
- AI Adapters Centralized: 33% (1 of 3)
- Prompts Centralized: 0% (0 of 9 inline prompts)
- Processing Centralized: 0% (duplicate logic everywhere)
- Config Centralized: 0% (missing file)
- Pipeline Exists: 0% (no inference pipeline)

## Quick Start - Fix P0 Issues Now

```bash
# 1. Restore missing config
cp /home/user/aibradaa/archive/obsolete_code_2025-11-08/ai-pod/config.mjs \
   /home/user/aibradaa/ai_pod/config.mjs

# 2. Update ai_pod config for modern Gemini
# (Manual edit needed - see full audit report)

# 3. Fix broken import in camera.mjs
# Change: from '../../ai-pod/config.mjs'
# To: from '../../ai_pod/config.mjs'  (underscore not hyphen)

# 4. Test that import works
node -e "import('./api/routes/camera.mjs').then(() => console.log('✅ Import works'))"
```

---

For full details, see: `AI_POD_CENTRALIZATION_AUDIT.md`

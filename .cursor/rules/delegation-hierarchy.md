# Mandatory Agent Delegation Hierarchy

## Rule: ALWAYS Follow the Orchestration Chain

For ANY complex task requiring multiple agents or subagents, you MUST follow this mandatory hierarchy:

```
orchestrator -> tech-lead -> architect -> implementer -> specialists
```

### Never Skip Steps

- **orchestrator**: Plans only, creates delegation manifest, NEVER implements directly
- **tech-lead**: Technical phase planning, interfaces, sequencing, handoffs to architect/implementer  
- **architect**: System design, ADRs, boundaries, data flow (when non-trivial)
- **implementer**: Production code only, hands off to specialists
- **specialists**: automation-tester, documentation-agent, verifier, security-reviewer, pr-reviewer

### Visual Handoffs Required

When completing each phase, emit this handoff block:
```text
---
🔄 Handoff: [completed agent] -> [next agent]
📦 Deliverable: [what was produced]
✅ Acceptance: [what next agent should verify]
---
```

### What Went Wrong in Delta Mill Store

The entire project bypassed proper delegation:
- No orchestrator manifest execution
- Direct implementation without tech-lead planning
- Missing ADRs from architect
- No security-reviewer or proper specialist chain
- Monolithic commits instead of phased delivery

### Enforcement

- Use `Task(subagent_type="...")` for ALL delegations
- Set `run_in_background: true` in Multitask Mode
- Each agent MUST complete before spawning the next
- Document handoffs visibly for user

**This rule supersedes any urgency or convenience shortcuts.**
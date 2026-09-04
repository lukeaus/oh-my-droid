# Performance Rules

## Model Selection Strategy

**light** (90% of medium capability, 3x cost savings):
- Lightweight agents with frequent invocation
- Code generation and exploration
- Worker agents in multi-agent systems

**medium** (Best coding model):
- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**heavy** (Deepest reasoning):
- Complex architectural decisions
- Maximum reasoning requirements
- Research and analysis tasks

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

## Algorithm Efficiency

Before implementing:
- [ ] Consider time complexity
- [ ] Avoid O(n^2) when O(n log n) possible
- [ ] Use appropriate data structures
- [ ] Cache expensive computations

## [CUSTOMIZE] Project-Specific Performance

Add your project-specific performance requirements here:
- Response time targets
- Bundle size limits
- Database query limits

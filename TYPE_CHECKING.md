# Type Checking Strategy

This monorepo uses an optimized type checking strategy to handle large codebases that would otherwise cause memory exhaustion.

## Available Commands

### Business Logic Package (`packages/business-logic/`)

```bash
# Daily use - fast optimized checking
pnpm check

# Periodic testing - full comprehensive checking
pnpm check:full

# Help
pnpm check:help
```

### Webapp (`apps/webapp/`)

```bash
# Daily use - fast minimal TypeScript checking
pnpm check

# Periodic testing - full TypeScript checking
pnpm check:full

# Optimized Svelte + TypeScript checking
pnpm check:svelte

# Complete Svelte + TypeScript checking
pnpm check:svelte-full

# Help
pnpm check:help
```

## Strategy Overview

### Optimized Configurations (Daily Use)
- **Purpose**: Fast feedback loop for development
- **Memory**: 8GB limit (`NODE_OPTIONS='--max-old-space-size=8192'`)
- **Scope**: Essential files only, excludes tests and large service files
- **TypeScript**: Reduced strictness for performance

### Full Configurations (Periodic Testing)
- **Purpose**: Comprehensive validation before releases
- **Memory**: 12GB limit (`NODE_OPTIONS='--max-old-space-size=12288'`)
- **Scope**: All source files including tests and complex dependencies
- **TypeScript**: Full strict checking

## Optimization Techniques Applied

1. **File Exclusion**: Large test files and complex service files excluded from daily checks
2. **Memory Limits**: Increased Node.js heap size to handle large codebases
3. **Incremental Builds**: Where possible, use incremental compilation
4. **Strict Mode**: Disabled for optimized configs to reduce complexity
5. **Module Resolution**: Optimized for bundler environments

## When to Use Each Command

### Daily Development
- Use `pnpm check` in the package you're working on
- Fast feedback for immediate TypeScript issues
- Safe to run frequently without memory concerns

### Before Commits/PRs
- Use `pnpm check:full` to ensure no regressions
- Test if your code optimizations have resolved memory issues
- Run in CI/CD pipelines if sufficient memory available

### Code Optimization Goals
- **Target**: Make `check:full` commands run successfully
- **Indicators**: Commands complete without OOM errors
- **Actions**: 
  - Break down large files (>500 lines)
  - Reduce complex type dependencies
  - Eliminate circular imports
  - Optimize import patterns

## Memory Requirements

| Command | Memory Limit | Expected Usage |
|---------|-------------|----------------|
| `check` | 8GB | Always works |
| `check:full` | 12GB | Goal to achieve |
| `check:svelte-full` | 12GB | Ultimate target |

## Configuration Files

- `tsconfig.check.json` - Optimized TypeScript checking
- `tsconfig.minimal.json` - Minimal webapp checking  
- `tsconfig.full.json` - Complete webapp checking
- `tsconfig.build.json` - Production build configuration

## Success Metrics

You'll know your optimizations are working when:
1. `pnpm check:full` completes without memory errors
2. Type checking time decreases significantly
3. Development feedback loop improves
4. CI/CD pipelines can run full checks

## Troubleshooting

If optimized checks start failing:
1. Check for new large files added
2. Look for complex type dependencies
3. Verify workspace dependencies are built
4. Consider excluding problematic files temporarily
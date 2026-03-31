# @philiprehberger/task-runner

[![CI](https://github.com/philiprehberger/ts-task-runner/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-task-runner/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/task-runner.svg)](https://www.npmjs.com/package/@philiprehberger/task-runner)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-task-runner)](https://github.com/philiprehberger/ts-task-runner/commits/main)

Task orchestration with dependency resolution and topological execution.

## Installation

```bash
npm install @philiprehberger/task-runner
```

## Usage

```ts
import { createRunner } from '@philiprehberger/task-runner';

const runner = createRunner({
  onStart: (name) => console.log(`Starting: ${name}`),
  onComplete: (name) => console.log(`Done: ${name}`),
});

runner.task('compile', async () => {
  await compileSource();
}, ['lint']);

runner.task('lint', async () => {
  await runLinter();
});

runner.task('test', async () => {
  await runTests();
}, ['compile']);

// Preview execution order
console.log(runner.dryRun('test')); // ['lint', 'compile', 'test']

// Execute with dependency resolution
await runner.run('test');
```

## API

### `createRunner(options?): Runner`

Creates a new task runner.

#### `RunnerOptions`

- **`onStart?(name)`** — Called when a task begins
- **`onComplete?(name)`** — Called when a task finishes
- **`onError?(name, error)`** — Called when a task fails

#### `Runner`

- **`task(name, fn, deps?)`** — Register a task with optional dependencies
- **`run(name?)`** — Execute a task and its dependencies, or all tasks if no name given
- **`dryRun(name?)`** — Return execution order as `string[]` without executing

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-task-runner)

🐛 [Report issues](https://github.com/philiprehberger/ts-task-runner/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-task-runner/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)

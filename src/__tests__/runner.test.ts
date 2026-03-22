import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRunner } from '../../dist/index.js';

describe('createRunner', () => {
  it('single task runs', async () => {
    const runner = createRunner();
    let ran = false;
    runner.task('a', () => { ran = true; });
    await runner.run('a');
    assert.equal(ran, true);
  });

  it('task with dependency runs dep first', async () => {
    const order: string[] = [];
    const runner = createRunner();
    runner.task('a', () => { order.push('a'); }, ['b']);
    runner.task('b', () => { order.push('b'); });
    await runner.run('a');
    assert.deepEqual(order, ['b', 'a']);
  });

  it('diamond dependency works', async () => {
    const order: string[] = [];
    const runner = createRunner();
    runner.task('A', () => { order.push('A'); }, ['B', 'C']);
    runner.task('B', () => { order.push('B'); }, ['D']);
    runner.task('C', () => { order.push('C'); }, ['D']);
    runner.task('D', () => { order.push('D'); });
    await runner.run('A');
    assert.equal(order[0], 'D');
    assert.equal(order[order.length - 1], 'A');
    assert.equal(order.length, 4);
  });

  it('circular dependency throws', () => {
    const runner = createRunner();
    runner.task('a', () => {}, ['b']);
    runner.task('b', () => {}, ['a']);
    assert.throws(() => runner.dryRun('a'), /Circular dependency/);
  });

  it('missing dependency throws', () => {
    const runner = createRunner();
    runner.task('a', () => {}, ['missing']);
    assert.throws(() => runner.dryRun('a'), /Missing dependency/);
  });

  it('dryRun returns execution order', () => {
    const runner = createRunner();
    runner.task('a', () => {}, ['b']);
    runner.task('b', () => {}, ['c']);
    runner.task('c', () => {});
    const order = runner.dryRun('a');
    assert.deepEqual(order, ['c', 'b', 'a']);
  });

  it('onStart and onComplete are called', async () => {
    const started: string[] = [];
    const completed: string[] = [];
    const runner = createRunner({
      onStart: (n) => started.push(n),
      onComplete: (n) => completed.push(n),
    });
    runner.task('x', () => {});
    await runner.run('x');
    assert.deepEqual(started, ['x']);
    assert.deepEqual(completed, ['x']);
  });

  it('independent tasks both complete', async () => {
    const order: string[] = [];
    const runner = createRunner();
    runner.task('a', () => { order.push('a'); });
    runner.task('b', () => { order.push('b'); });
    await runner.run();
    assert.equal(order.length, 2);
    assert.ok(order.includes('a'));
    assert.ok(order.includes('b'));
  });

  it('onError called on failure', async () => {
    const errors: string[] = [];
    const runner = createRunner({
      onError: (name) => errors.push(name),
    });
    runner.task('fail', () => { throw new Error('boom'); });
    await assert.rejects(() => runner.run('fail'));
    assert.deepEqual(errors, ['fail']);
  });
});

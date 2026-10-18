import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateSlaDueDate, isSlaBreached, SLA_HOURS_BY_PRIORITY } from '../lib/workflow/sla.ts';
import { canTransitionStatus, STATUS_TRANSITIONS } from '../lib/workflow/status.ts';

describe('SmartDesk SLA Workflow Calculations', () => {
  it('correctly allocates SLA hours according to priority tier', () => {
    assert.strictEqual(SLA_HOURS_BY_PRIORITY.urgent, 4);
    assert.strictEqual(SLA_HOURS_BY_PRIORITY.high, 12);
    assert.strictEqual(SLA_HOURS_BY_PRIORITY.medium, 24);
    assert.strictEqual(SLA_HOURS_BY_PRIORITY.low, 48);
  });

  it('calculates expected due date into future based on hours', () => {
    const base = new Date('2026-10-18T10:00:00Z');
    const urgentDue = calculateSlaDueDate('urgent', base);
    const diffHours = (urgentDue.getTime() - base.getTime()) / (1000 * 60 * 60);
    assert.strictEqual(diffHours, 4);

    const lowDue = calculateSlaDueDate('low', base);
    const lowDiffHours = (lowDue.getTime() - base.getTime()) / (1000 * 60 * 60);
    assert.strictEqual(lowDiffHours, 48);
  });

  it('detects SLA breaches when deadline has passed for open tickets', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    assert.strictEqual(isSlaBreached(pastDate, 'open'), true);
    assert.strictEqual(isSlaBreached(pastDate, 'in_progress'), true);
  });

  it('does not flag resolved or closed tickets as breached', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000);
    assert.strictEqual(isSlaBreached(pastDate, 'resolved'), false);
    assert.strictEqual(isSlaBreached(pastDate, 'closed'), false);
  });
});

describe('SmartDesk Status Transition State Machine', () => {
  it('allows staff to move open ticket to in_progress and then resolved', () => {
    const step1 = canTransitionStatus('open', 'in_progress', true);
    assert.strictEqual(step1.allowed, true);

    const step2 = canTransitionStatus('in_progress', 'resolved', true);
    assert.strictEqual(step2.allowed, true);
  });

  it('prohibits customers from directly marking open tickets as in_progress', () => {
    const check = canTransitionStatus('open', 'in_progress', false);
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason?.includes('support agents'));
  });

  it('allows customer to close their own open ticket or reopen resolved ticket', () => {
    const closeCheck = canTransitionStatus('open', 'closed', false);
    assert.strictEqual(closeCheck.allowed, true);

    const reopenCheck = canTransitionStatus('resolved', 'open', false);
    assert.strictEqual(reopenCheck.allowed, true);
  });

  it('rejects invalid jumps such as open directly to resolved', () => {
    const invalidJump = canTransitionStatus('open', 'resolved', true);
    assert.strictEqual(invalidJump.allowed, false);
  });
});

import { describe, expect, it } from 'vitest';

import { describeAuditAction, humanizeAuditAction } from './action-labels';

describe('describeAuditAction', () => {
  it('labels known actions in both languages with the right category', () => {
    expect(describeAuditAction('auth.logout')).toEqual({
      label: 'Signed out',
      category: 'security',
    });
    expect(describeAuditAction('auth.logout', 'bn').label).toBe('সাইন-আউট করেছেন');
    expect(describeAuditAction('publication.scheduled_publish').category).toBe('publishing');
  });

  it('does not confuse a user update with a post update (regression)', () => {
    expect(describeAuditAction('user.avatar_update')).toEqual({
      label: 'Profile photo updated',
      category: 'people',
    });
    expect(describeAuditAction('post.update').category).toBe('content');
  });

  it('humanizes unknown actions and infers the category from the prefix', () => {
    expect(describeAuditAction('media.rotate')).toEqual({
      label: 'Media rotate',
      category: 'media',
    });
    expect(describeAuditAction('billing.invoice_paid')).toEqual({
      label: 'Billing invoice paid',
      category: 'system',
    });
  });
});

describe('humanizeAuditAction', () => {
  it('replaces separators and capitalizes, with a safe fallback', () => {
    expect(humanizeAuditAction('user.avatar_update')).toBe('User avatar update');
    expect(humanizeAuditAction('')).toBe('System event');
  });
});

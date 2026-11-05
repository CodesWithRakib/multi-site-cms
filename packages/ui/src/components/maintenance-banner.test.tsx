import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MaintenanceBanner } from './maintenance-banner';

describe('MaintenanceBanner', () => {
  it('announces the notice politely, with the Bangla text marked as Bangla', () => {
    render(<MaintenanceBanner notice="Back soon." noticeBn="শীঘ্রই ফিরছি।" />);

    const banner = screen.getByRole('status');
    expect(banner.textContent).toContain('Back soon.');
    expect(screen.getByText('শীঘ্রই ফিরছি।').getAttribute('lang')).toBe('bn');
  });

  it('renders only the primary notice when no Bangla text is given', () => {
    const { container } = render(<MaintenanceBanner notice="Back soon." />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });
});

// src/routes.test.jsx — every URL in CLAUDE.md's "Frontend routes and screens"
// table opens the right screen.
//
// The screens are placeholders for now (just a heading). As each real screen is
// built, its own tests take over, but this table keeps proving the URLs work.

import { screen } from '@testing-library/react';
import { renderWithProviders } from './test/renderWithProviders';

describe('routes', () => {
  // [URL, the heading that screen shows]
  it.each([
    ['/', 'Boxy'],
    ['/signup', 'Sign up'],
    ['/login', 'Log in'],
    ['/boxes', 'My Boxes'],
    ['/boxes/new', 'New box'],
    ['/boxes/7', 'Box'],
    ['/boxes/7/edit', 'Edit box'],
    ['/boxes/7/items/new', 'Add item'],
    ['/items/3', 'Item'],
    ['/items/3/edit', 'Edit item'],
  ])('%s shows the "%s" screen', (route, heading) => {
    renderWithProviders({ route });

    // level: 1 = each screen's own <h1>. `name` is an exact match, so "Box"
    // doesn't also match "New box" or "Edit box".
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('shows a "Page not found" screen for an unknown URL', () => {
    renderWithProviders({ route: '/no/such/page' });

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    // Give the user a way out, rather than a dead end.
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });
});

// src/App.test.jsx — tests for the root <App /> component.

import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('shows "Boxy" as the main page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Boxy' })).toBeInTheDocument(); // checks the document to see if a heading with the exact text 'Boxy' exists
  });
});

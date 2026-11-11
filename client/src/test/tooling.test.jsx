// src/test/tooling.test.jsx — proves the client test stack is wired up:
// Babel (JSX), jsdom (a fake document), React Testing Library (render/screen),
// jest-dom (toBeInTheDocument) and MSW (a mocked API) all working together.
//
// The component below exists only for this test. Real components get their
// own tests next to them, e.g. src/App.test.jsx.

import { useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './server';

function HealthStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body) => setStatus(body.status))
      .catch(() => setStatus('unreachable'));
  }, []);

  return <p>API status: {status}</p>;
}

describe('client test tooling', () => {
  it('renders JSX and reads the default mocked API response', async () => {
    render(<HealthStatus />);

    // findBy* waits (up to 1s by default) for the text to appear, because the
    // fetch resolves after the first render.
    expect(await screen.findByText('API status: ok')).toBeInTheDocument();
  });

  it('lets a single test override a handler', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'degraded' })));

    render(<HealthStatus />);

    expect(await screen.findByText('API status: degraded')).toBeInTheDocument();
  });
});

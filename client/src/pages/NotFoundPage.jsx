// src/pages/NotFoundPage.jsx — shown for any URL that matches no route
// (the `path: '*'` entry at the end of src/routes.jsx).

import { Link } from 'react-router-dom';

// used <link> instead of <a> because <a href="/"> reloads the whole app which will empty the Redux store meaning everything in memory will be lost
function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <Link to="/">Back to home</Link>
    </main>
  );
}

export default NotFoundPage;

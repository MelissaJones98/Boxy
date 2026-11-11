// src/pages/Placeholder.jsx — a stand-in screen showing only the heading the
// real screen will have. Each build step swaps one route over to its real page.

function Placeholder({ title }) {
  return (
    // "page" = the shared layout in src/styles/base.css (gutters, max width).
    // JSX uses className, not class, because `class` is a reserved word in JavaScript.
    <main className="page">
      <h1>{title}</h1>
    </main>
  );
}

export default Placeholder;

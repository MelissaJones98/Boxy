// src/pages/Placeholder.jsx — a stand-in screen showing only the heading the
// real screen will have. Each build step swaps one route over to its real page.

function Placeholder({ title }) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  );
}

export default Placeholder;

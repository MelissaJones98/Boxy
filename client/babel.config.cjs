// client/babel.config.cjs — used ONLY by Jest (through babel-jest).
//
// Vite compiles JSX and modern JavaScript itself (with esbuild/Rolldown) when
// you run `npm run dev` or `npm run build`; it ignores this file. Jest can't
// read JSX or `import` syntax, so babel-jest rewrites each file before the test
// runs it, using these presets.
//
// The .cjs extension matters: client/package.json says "type": "module", so a
// plain .js file here would be treated as an ES module, and Babel config is
// loaded as CommonJS (module.exports).

module.exports = {
  presets: [
    // Turn `import`/`export` and newer syntax into what the current Node
    // version (the one running Jest) understands.
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // Turn JSX into function calls. "automatic" is React 17+'s JSX transform,
    // so components don't need `import React from 'react'` at the top.
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};

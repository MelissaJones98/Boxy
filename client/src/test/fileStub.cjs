// src/test/fileStub.cjs — what an image import becomes inside Jest.
// In the real app, `import logo from './logo.svg'` gives a URL. In tests we
// only need *a* string, so every image import returns this one.
module.exports = 'test-file-stub';

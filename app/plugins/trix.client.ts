// Load Trix editor on client side
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Import Trix CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/trix@2.1.10/dist/trix.css';
    document.head.appendChild(link);

    // Import Trix JS
    import('trix');
  }
});


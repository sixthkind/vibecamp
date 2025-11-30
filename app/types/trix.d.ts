// Type definitions for Trix editor
declare module 'trix' {
  const Trix: any;
  export default Trix;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'trix-editor': any;
      'trix-toolbar': any;
    }
  }
}

export {};



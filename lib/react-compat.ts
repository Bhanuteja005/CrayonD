// This file provides compatibility for legacy React methods in React 18+

import { createRoot } from 'react-dom/client';

// Create a map to track root instances
const roots = new Map<Element | DocumentFragment, ReturnType<typeof createRoot>>();

// Polyfill for unmountComponentAtNode
export function unmountComponentAtNode(container: Element | DocumentFragment): boolean {
  const root = roots.get(container);
  
  if (root) {
    root.unmount();
    roots.delete(container);
    return true;
  }
  
  return false;
}

// Export a replacement for ReactDOM.render
export function render(element: React.ReactNode, container: Element | DocumentFragment): void {
  if (!roots.has(container)) {
    roots.set(container, createRoot(container));
  }
  
  const root = roots.get(container)!;
  root.render(element);
}

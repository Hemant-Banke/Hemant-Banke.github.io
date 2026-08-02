import { Component, type ReactNode } from "react";

/**
 * Catches render/lifecycle errors in its subtree so a crash (eg. a
 * browser-specific PDF.js/worker failure) shows a real fallback instead of
 * silently blanking the whole page — React unmounts up to the nearest
 * boundary on an uncaught error, and there wasn't one around the PDF viewer.
 */
export default class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

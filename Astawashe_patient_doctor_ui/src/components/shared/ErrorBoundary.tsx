import { Component, type ReactNode } from 'react';

/** Shows a recoverable message instead of a blank screen if a view crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto mt-20 max-w-md px-4 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-slate-600">This page hit an unexpected error. Reload to continue.</p>
        <button type="button" className="btn-primary mt-4" onClick={() => window.location.assign('/')}>
          Reload
        </button>
      </div>
    );
  }
}

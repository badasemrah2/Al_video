"use client";
import React from 'react';

interface State { hasError: boolean; error?: any; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any): State { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 font-mono text-sm space-y-3 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h2 className="text-base font-semibold">UI hata verdi</h2>
          <pre className="whitespace-pre-wrap break-words max-h-64 overflow-auto bg-white/60 p-3 rounded border border-red-100">
            {String(this.state.error)}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-3 py-1.5 border border-red-300 rounded bg-white/70 hover:bg-white transition text-xs font-medium"
          >
            Tekrar dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

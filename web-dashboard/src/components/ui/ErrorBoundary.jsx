import React from "react";
import StatePanel, { StateRetry } from "./StatePanel";
import { t } from "../../utils/i18n";

/**
 * ErrorBoundary — the application-level crash surface (FIX-10).
 *
 * A render throw unmounts the whole tree and leaves a blank page. On a clinical
 * console that is not a cosmetic problem: the carer loses the pressure reading,
 * which is the entire product, with no cause and nothing to press. React only
 * catches a render throw through a class component, so this is the one class
 * component in the codebase.
 *
 * The two lifecycle halves do different jobs and both are needed:
 *
 *   getDerivedStateFromError — derives the fallback flag for this render
 *   componentDidCatch        — reports the error and its component stack
 *
 * The boundary is mounted ABOVE the providers and the auth hook so it catches a
 * throw from either of them and not only from a page. That placement is why the
 * copy resolves through `t(key)` with the language argument omitted: the
 * dictionary's own default is Indonesian (D-05), so the fallback renders
 * without reading context that a thrown provider may have taken down with it.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Report rather than swallow. A boundary that hides the defect behind a
    // friendly panel has moved the problem, not fixed it.
    console.error(
      "[ErrorBoundary] render error",
      error,
      info && info.componentStack
    );
  }

  /** The recovery action: clear the error so the wrapped subtree renders again. */
  handleReset() {
    this.setState({ hasError: false });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 py-10">
        <StatePanel
          variant="error"
          className="w-full max-w-md"
          title={t("error.boundary.title")}
          description={t("error.boundary.body")}
          action={
            <StateRetry
              onRetry={this.handleReset}
              label={t("error.boundary.action")}
            />
          }
        />
      </div>
    );
  }
}

export { ErrorBoundary };
export default ErrorBoundary;

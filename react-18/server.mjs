import http from "node:http";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";

/**
 * ✅ ✅ ✅ ✅ ✅ Note:
 * This is the copied React 18 version and does not have an infinite loop
 *
 * This file shows a basic reproduction of an infinite hydration loop we can
 * get into with React 17 when hydrating the full document with <html>.
 *
 * The general gist is that we render a tree such as this on the server:
 *
 * <AppErrorBoundary>
 *   <HtmlComponent />
 * </AppErrorBoundary>
 *
 * <HtmlComponent> renders a root <html> element includes all of the <script>
 * tags for hydration into `document`.  It also renders a child component that
 * renders fine on th server but throws an error during client-side hydration
 * rendering.
 *
 * <AppErrorBoundary> is there to catch any client-side render errors and
 * render it's own <html> document.
 *
 * What appears to happen is that the error boundary works as expected and
 * <AppErrorBoundary> catches the initial error thrown by <ComponentThatErrorsClientSide>
 * and renders <HtmlBoundary>:
 *
 * > React will try to recreate this component tree from scratch using the error boundary you provided, AppErrorBoundary.
 *
 * But then it tries append the newly rendered client-side tree, which is also
 * an <html> document into the hydrated root (document), which is invalid and
 * throws:
 *
 * > Uncaught DOMException: Failed to execute 'appendChild' on 'Node': Only one element on document allowed.
 *
 * Then we get into a loop with separate error (I think) trying to clean up the
 * failed error boundary render, presumably because it never mad eit into the
 * DOM in the first place:
 *
 * > Uncaught DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
 *
 * An from then on it's just an infinite loop of the `appendChild`/`removeChild`
 * errors and we can never successfully render the boundary.
 *
 * It seems as if the React 17 approach of:
 *   1. detect error during hydration
 *   2. append rendered boundary next to SSR DOM content
 *   3. delete SSR DOM content
 *
 * will always fail when hydrating the document since you can never perform
 * step (2) when the root is `document`?
 */

function ComponentThatErrorsClientSide() {
  if (typeof document !== "undefined") {
    throw new Error("Client-only error");
  }
  return React.createElement("h1", null, "Hello React");
}

function HtmlComponent() {
  return React.createElement(
    "html",
    null,
    React.createElement("head"),
    React.createElement(
      "body",
      null,
      React.createElement(ComponentThatErrorsClientSide),
      React.createElement("script", {
        crossOrigin: "true",
        src: "https://unpkg.com/react@18/umd/react.development.js",
      }),
      React.createElement("script", {
        crossOrigin: "true",
        src: "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
      }),
      React.createElement("script", {
        async: "async",
        dangerouslySetInnerHTML: {
          __html:
            ComponentThatErrorsClientSide.toString() +
            "\n" +
            HtmlComponent.toString() +
            "\n" +
            HtmlBoundary.toString() +
            "\n" +
            AppErrorBoundary.toString() +
            "\n" +
            App.toString() +
            "\n" +
            "ReactDOM.hydrateRoot(document, React.createElement(App));",
        },
      })
    )
  );
}

function HtmlBoundary() {
  return React.createElement(
    "html",
    null,
    React.createElement("head"),
    React.createElement(
      "body",
      null,
      React.createElement("pre", null, "Error Boundary!")
    )
  );
}

class AppErrorBoundary extends React.Component {
  constructor() {
    super();
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "AppErrorBoundary caught the following error during render",
      error,
      errorInfo
    );
  }

  render() {
    return this.state.error
      ? React.createElement(HtmlBoundary)
      : this.props.children;
  }
}

function App() {
  return React.createElement(
    AppErrorBoundary,
    null,
    React.createElement(HtmlComponent)
  );
}

let server = http.createServer((req, res) => {
  let doc = ReactDOMServer.renderToString(React.createElement(App));
  res.setHeader("Content-Type", "text/html");
  res.write("<!DOCTYPE html>" + doc);
  res.end();
});

server.listen(3000, () => {
  console.log("server listening on http://localhost:3000");
});

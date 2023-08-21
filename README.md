# React SSR Hydration Loop

This is a manual reproduction for [this issue](https://github.com/remix-run/remix/issues/1678) in the Remix repository which recreates the issue in a manual React SSR setup without using Remix.

The issue appears to boil down to a React 17 problem with how to handle `hydrate` calls on `document` when there is a top-level `ErrorBoundary` _outside_ of the React-rendered `<html>` element.

The issue is fixed when using React 18.

> **Warning**
>
> Please note that the bug this repo is exposing is an infinite loop, so running the Rewact 17 example **will put your browser into an infinite loop and you will need to kill the browser tab**. Please proceed with caution 😈.

To run the examples, cd into `react-17` or `react-18` and run the following on node 18 or later:

```
npm install
node server.mjs
```

Then load http://localhost:3000

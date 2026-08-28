import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import {
  ReadableStream as NodeReadableStream,
  TextDecoderStream as NodeTextDecoderStream,
} from "node:stream/web";

// Node 26 exposes a built-in `localStorage` global that is undefined unless the
// runtime is started with --localstorage-file, and it shadows the jsdom one.
if (!globalThis.localStorage) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    key: (index) => [...store.keys()][index] ?? null,
    getItem: (key) => store.get(String(key)) ?? null,
    setItem: (key, value) => void store.set(String(key), String(value)),
    removeItem: (key) => void store.delete(String(key)),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: memoryStorage,
  });
}

// jsdom does not implement the streams API that useChat relies on.
if (typeof globalThis.ReadableStream === "undefined") {
  globalThis.ReadableStream = NodeReadableStream as unknown as typeof globalThis.ReadableStream;
}
if (typeof globalThis.TextDecoderStream === "undefined") {
  globalThis.TextDecoderStream =
    NodeTextDecoderStream as unknown as typeof globalThis.TextDecoderStream;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

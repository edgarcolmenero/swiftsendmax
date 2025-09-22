// utils/observe.js
// Robust, tiny IntersectionObserver utilities with once/batch helpers.

const defaultOpts = {
  root: null,
  rootMargin: '0px 0px -10% 0px',
  threshold: 0.1,
};

function makeObserver(opts = {}) {
  const config = { ...defaultOpts, ...opts };
  const callbacks = new WeakMap();

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const data = callbacks.get(entry.target);
      if (!data) continue;

      const { onEnter, onExit, once } = data;

      if (entry.isIntersecting) {
        if (onEnter) onEnter(entry);
        if (once) {
          io.unobserve(entry.target);
          callbacks.delete(entry.target);
        }
      } else if (onExit) {
        onExit(entry);
      }
    }
  }, config);

  function observe(el, { onEnter, onExit, once = false } = {}) {
    if (!el) return () => {};
    callbacks.set(el, { onEnter, onExit, once });
    io.observe(el);
    return () => {
      try {
        io.unobserve(el);
      } catch {}
      callbacks.delete(el);
    };
  }

  function observeAll(els, options) {
    const unsub = [];
    els.forEach((el) => unsub.push(observe(el, options)));
    return () => unsub.forEach((fn) => fn && fn());
  }

  function disconnect() {
    io.disconnect();
  }

  return { observe, observeAll, disconnect };
}

// One-shot convenience for a NodeList/Array
export function onEnterBatch(els, handler, { once = true, ...opts } = {}) {
  const { observeAll } = makeObserver(opts);
  return observeAll(els, { onEnter: handler, once });
}

export function onEnter(el, handler, { once = false, ...opts } = {}) {
  const { observe } = makeObserver(opts);
  return observe(el, { onEnter: handler, once });
}

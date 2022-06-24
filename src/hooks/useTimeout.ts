import { useCallback, useEffect, useRef } from 'react';

export default function useTimeout(): [
  (func: any, ms: any) => void,
  () => void,
  React.MutableRefObject<unknown>
] {
  const handle = useRef();

  const start = useCallback((func, ms) => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'undefined... Remove this comment to see the full error message
    handle.current = setTimeout(func, ms);
  }, []);

  const stop = useCallback(
    () => handle.current && clearTimeout(handle.current),
    []
  );

  useEffect(() => () => stop(), [stop]);

  return [start, stop, handle];
}

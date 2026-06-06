import { useRef } from "react";

/** Keeps a ref aligned with the latest value for mount-only listeners/cleanup. */
export function useLiveRef<T>(value: T) {
  const ref = useRef(value);
  // Latest-ref pattern for useMountEffect handlers; not used during render output.
  // eslint-disable-next-line react-hooks/refs -- intentional sync for stable mount listeners
  ref.current = value;
  return ref;
}

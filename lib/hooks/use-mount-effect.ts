import { useEffect } from "react";

export function useMountEffect(effect: () => void | (() => void)) {
  useEffect(() => effect(), []); // eslint-disable-line react-hooks/exhaustive-deps
}

import { useEffect } from "react";
import { site } from "../site";

/* There is no server render here, so the title is set on mount. */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${site.name}` : site.name;
  }, [title]);
}

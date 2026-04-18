import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { desktopV3RoutePathById } from "@/app/router/route-registry";
import { notify } from "@/lib/notify";

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target)) {
        return;
      }

      const metaPressed = event.metaKey || event.ctrlKey;
      if (!metaPressed) {
        return;
      }

      if (event.key === ",") {
        event.preventDefault();
        void navigate(desktopV3RoutePathById.preferences);
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        window.dispatchEvent(new Event("desktop-v3:refresh-requested"));
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        notify.info("当前骨架页面没有可执行的新建动作。");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);
}

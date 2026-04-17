import { useEffect, useState } from "react";

type LayoutMode = "compact" | "standard" | "centered";

interface ShellLayoutState {
  isCompact: boolean;
  layoutMode: LayoutMode;
  sidebarWidth: number;
}

function getLayoutState(width: number): ShellLayoutState {
  if (width < 1366) {
    return {
      isCompact: true,
      layoutMode: "compact",
      sidebarWidth: 200,
    };
  }

  if (width >= 1920) {
    return {
      isCompact: false,
      layoutMode: "centered",
      sidebarWidth: 240,
    };
  }

  return {
    isCompact: false,
    layoutMode: "standard",
    sidebarWidth: 240,
  };
}

export function useShellLayout() {
  const [layout, setLayout] = useState<ShellLayoutState>(() => getLayoutState(window.innerWidth));

  useEffect(() => {
    const handleResize = () => {
      setLayout(getLayoutState(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return layout;
}

import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/app/layout/app-shell";

describe("AppShell", () => {
  it("renders the sidebar and current route header", () => {
    window.innerWidth = 1440;

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <AppShell />,
          handle: {
            title: "桌面骨架总览",
            subtitle: "桌面骨架",
            shortLabel: "总览",
          },
          children: [
            {
              index: true,
              element: <div>dashboard-content</div>,
              handle: {
                title: "桌面骨架总览",
                subtitle: "桌面骨架",
                shortLabel: "总览",
              },
            },
          ],
        },
      ],
      {
        initialEntries: ["/"],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getAllByText("AigcFox Desktop V3").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "桌面骨架总览" })).toBeTruthy();
    expect(screen.getByText("dashboard-content")).toBeTruthy();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The shell's contract - SHELL-01 to SHELL-07.
 *
 * `App.test.jsx` exercises the shell through the real `App`, which is the right
 * place for "does signing in reveal the navigation". This file is the other
 * half: the shell's own promises, asserted where they are made, so a rebuild of
 * `AppLayout` cannot quietly drop the header, the dialog behaviour, the account
 * menu or the six destinations while the integrated smoke tests stay green.
 *
 * The shell is the Cadra light header: a brand card, a dark nav pill that owns
 * every destination, and a right-hand group carrying the three state controls
 * (search, bell, avatar). Below `lg` all of that collapses into the existing
 * mobile bar and drawer.
 */

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    displayName: null,
    login: async () => ({ success: true }),
    register: async () => ({ success: true }),
    logout: () => {},
    uploadProfilePhoto: async () => {},
  }),
}));

vi.mock("../../services/firebaseRealtime", () => ({
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
  mapReadingPacket: () => null,
  mapHistory: () => [],
}));

const { InsoleProvider } = await import("../../context/InsoleContext");
const { AppLayout } = await import("./AppLayout");

/* ============================== the sources ============================== */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRATCH = "__oil_ui_eval__";

const read = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");

/** Strip block comments, then line comments; a URL scheme is not a comment. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/**
 * Every shipped source under `src`, recursively. Tests are excluded because a
 * test for a rule has to be able to name the thing it forbids; the scratch page
 * is excluded for the same reason the other gates exclude it.
 */
const collectSources = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === SCRATCH) continue;
      out.push(...collectSources(full));
    } else if (
      /\.(jsx?|tsx?|css)$/.test(entry.name) &&
      !entry.name.includes(".test.")
    ) {
      out.push(full);
    }
  }
  return out;
};

const FILES = collectSources(SRC);

/** The elements in `root` carrying an exact class token. */
const layout = (root, token) =>
  Array.from(root.querySelectorAll("*")).filter((el) => el.classList.contains(token));

/* ============================== the fixtures ============================= */

/** The six destinations `App.jsx` builds, in the order it builds them. */
const LINKS = [
  { id: "dashboard", to: "/", label: "Dasbor", icon: "Home" },
  { id: "monitoring", to: "/monitoring", label: "Pemantauan", icon: "Chart" },
  { id: "history", to: "/history", label: "Riwayat", icon: "History" },
  { id: "device", to: "/device", label: "Perangkat", icon: "Device" },
  { id: "settings", to: "/settings", label: "Pengaturan", icon: "Settings" },
  { id: "profile", to: "/profile", label: "Profil", icon: "User" },
];

const ADMIN_LINK = { id: "admin", to: "/admin", label: "Admin", icon: "Shield" };

/** Reports where the router ended up, so a navigation can be asserted. */
const Probe = () => {
  const { pathname } = useLocation();
  return <span data-testid="route">{pathname}</span>;
};

const renderShell = (props = {}) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <InsoleProvider>
        <AppLayout links={LINKS} {...props}>
          <Probe />
        </AppLayout>
      </InsoleProvider>
    </MemoryRouter>
  );

const pill = () => screen.getByRole("navigation");

/* ================================ tests ================================== */

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.style.overflow = "";
});

describe("SHELL-01: the Cadra frame", () => {
  it("has no left rail at all - the pill owns the destinations", () => {
    const { container } = renderShell();

    // The 288px rail and its content offset are gone, not restyled: any of
    // them surviving means the old frame is still mounted somewhere.
    expect(layout(container, "w-72")).toHaveLength(0);
    expect(layout(container, "lg:pl-72")).toHaveLength(0);
    expect(document.getElementById("app-rail")).toBeNull();
    expect(document.querySelector('[aria-controls="app-rail"]')).toBeNull();
  });

  it("keeps the content column capped, with 32px gutters at lg", () => {
    const { container } = renderShell();

    expect(layout(container, "lg:px-8").length).toBeGreaterThan(0);
    expect(layout(container, "max-w-[1400px]").length).toBeGreaterThan(0);
  });

  it("puts the pillar nav before the content column, so Tab reads it first", () => {
    const { container } = renderShell();
    const nav = pill();
    const main = container.querySelector("#main-content");

    expect(nav).not.toBeNull();
    expect(main).not.toBeNull();
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe("SHELL-02: one nav pill for the destinations", () => {
  it("carries exactly the six clinical destinations, in order", () => {
    renderShell();

    const hrefs = within(pill())
      .getAllByRole("link")
      .map((anchor) => anchor.getAttribute("href"));

    expect(hrefs).toEqual([
      "/",
      "/monitoring",
      "/history",
      "/device",
      "/settings",
      "/profile",
    ]);
  });

  it("marks the active destination with aria-current inside the pill", () => {
    renderShell();

    const active = within(pill())
      .getAllByRole("link")
      .find((anchor) => anchor.getAttribute("aria-current") === "page");

    expect(active).toBeDefined();
    expect(active.getAttribute("href")).toBe("/");
  });

  it("keeps the alert queue off the pill and on the bell", () => {
    const { container } = renderShell({ hasUnread: true });

    // The pill is places; the alert queue is a state of the app. Listing it in
    // both would be two controls for one destination.
    expect(pill().querySelector('a[href="/notifications"]')).toBeNull();

    // The bell reaches it, marks it, and says so rather than reading as "bell".
    // One bell per breakpoint row (mobile bar, desktop header), one visible.
    const bells = Array.from(container.querySelectorAll('a[href="/notifications"]'));
    expect(bells.length).toBeGreaterThan(0);
    expect(bells.some((bell) => bell.textContent.trim() !== "")).toBe(true);
    expect(
      bells.some((bell) => bell.querySelector('[aria-hidden="true"].rounded-full'))
    ).toBe(true);
  });

  it("reports unread state in words, not only as a dot", () => {
    const quiet = renderShell({ hasUnread: false });
    const quietName = quiet.container
      .querySelector('a[href="/notifications"]')
      .textContent.trim();
    quiet.unmount();

    const loud = renderShell({ hasUnread: true });
    const loudName = loud.container
      .querySelector('a[href="/notifications"]')
      .textContent.trim();
    loud.unmount();

    expect(quietName).not.toBe("");
    expect(quietName).not.toBe(loudName);
  });

  it("gives the admin destination its own icon instead of the dashboard fallback", () => {
    const { container } = renderShell({ links: [...LINKS, ADMIN_LINK] });
    const iconClass = (href) =>
      container.querySelector(`a[href="${href}"] svg`)?.getAttribute("class") || "";

    // `renderIcon` falls back to the dashboard glyph for an icon name it does
    // not know, so an unregistered "Shield" would silently draw a second
    // dashboard entry rather than fail.
    expect(iconClass("/admin")).toMatch(/shield/i);
    expect(iconClass("/admin")).not.toBe(iconClass("/"));
  });
});

describe("SHELL-03: the header carries state, not a second place", () => {
  it("holds the combobox, the bell and the account trigger together", () => {
    const { container } = renderShell();
    const header = screen.getByRole("navigation").closest("header");

    expect(header).not.toBeNull();
    expect(within(container).getAllByRole("combobox").length).toBeGreaterThan(0);
    expect(header.querySelector('a[href="/notifications"]')).not.toBeNull();

    // The account control is a trigger for the menu, not a stale link.
    expect(document.querySelector('[aria-controls="account-menu"]')).not.toBeNull();
  });

  it("renders each destination exactly once across the whole shell", () => {
    const { container } = renderShell();

    for (const link of LINKS) {
      const found = container.querySelectorAll(`a[href="${link.to}"]`);
      // The pill is the one owner (the drawer and the account menu ship their
      // menus closed, so nothing else renders a destination link).
      expect(
        found.length,
        `${link.to} rendered ${found.length} times`
      ).toBe(1);
    }
  });
});

describe("SHELL-04: the search is a real control", () => {
  // Labels chosen so one query matches exactly two of three.
  const SEARCH_LINKS = [
    { id: "alpha", to: "/alpha", label: "Alpha", icon: "Home" },
    { id: "alpine", to: "/alpine", label: "Alpine", icon: "Home" },
    { id: "bravo", to: "/bravo", label: "Bravo", icon: "Home" },
  ];

  const openSearch = async (user, query) => {
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, query);
    return input;
  };

  it("walks the results with the arrow keys and keeps aria-activedescendant in step", async () => {
    const user = userEvent.setup();
    renderShell({ links: SEARCH_LINKS });
    const input = await openSearch(user, "alp");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);

    // Down wraps forward off the end, Up wraps backward off the start.
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
  });

  it("navigates on Enter to the highlighted result", async () => {
    const user = userEvent.setup();
    renderShell({ links: SEARCH_LINKS });
    const input = await openSearch(user, "alp");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("route")).toHaveTextContent("/alpine");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes when the pointer lands outside it", async () => {
    const user = userEvent.setup();
    renderShell({ links: SEARCH_LINKS });
    await openSearch(user, "alp");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByTestId("route"));

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("keeps aria-controls resolvable even when nothing matches", async () => {
    const user = userEvent.setup();
    renderShell({ links: SEARCH_LINKS });
    const input = await openSearch(user, "zzz");

    // No listbox is rendered, but the combobox still says it is expanded, so
    // the control id has to point at the popup itself rather than at nothing.
    expect(screen.queryByRole("listbox")).toBeNull();
    const controls = input.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls)).not.toBeNull();
  });

  it("drops aria-controls while no popup is shown at all", () => {
    renderShell({ links: SEARCH_LINKS });
    expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-controls");
  });

  it("offers only destinations the router actually declares", () => {
    // The claim is "every result navigates somewhere that exists", so the two
    // halves are read from the same file that builds both.
    const app = read("App.jsx");
    const declared = new Set(
      [...app.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1])
    );
    const navTargets = [...app.matchAll(/to: "([^"]+)"/g)].map(
      (match) => match[1]
    );

    // The six clinical destinations plus the admin one, which is conditional but
    // declared by the same builder.
    expect(navTargets).toHaveLength(7);
    expect(navTargets.filter((to) => !declared.has(to))).toEqual([]);
  });

  it("sends a record result to the history page, which exists", () => {
    expect(read(path.join("components", "layout", "AppSearch.jsx"))).toMatch(
      /navigate\("\/history"\)/
    );
    expect(read("App.jsx")).toMatch(/<Route path="\/history"/);
  });
});

describe("SHELL-05: the drawer is a real dialog", () => {
  const openDrawer = async (user) => {
    const trigger = document.querySelector('[aria-controls="nav-drawer"]');
    expect(trigger).not.toBeNull();
    await user.click(trigger);
    return { trigger, drawer: screen.getByRole("dialog") };
  };

  /** What the dialog promises Tab can reach, read from the DOM. */
  const tabbables = (drawer) =>
    Array.from(
      drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')
    );

  const pressTab = (options = {}) => {
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  };

  it("moves focus in, locks the page behind, and gives focus back", async () => {
    const user = userEvent.setup();
    renderShell();
    const { trigger, drawer } = await openDrawer(user);

    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(drawer).toHaveAccessibleName();
    expect(drawer.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps Tab inside the dialog, forwards and backwards", async () => {
    const user = userEvent.setup();
    renderShell();
    const { drawer } = await openDrawer(user);

    const focusables = tabbables(drawer);
    expect(focusables.length).toBeGreaterThan(2);

    const [first] = focusables;
    const last = focusables[focusables.length - 1];

    last.focus();
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    first.focus();
    expect(pressTab({ shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("leaves ordinary tabbing alone between the two ends", async () => {
    const user = userEvent.setup();
    renderShell();
    const { drawer } = await openDrawer(user);

    const middle = tabbables(drawer)[1];
    // The search input opens its popup on focus, so this is a state update.
    act(() => middle.focus());

    const event = pressTab();

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(middle);
  });

  it("pulls focus back in if it is standing outside the dialog", async () => {
    const user = userEvent.setup();
    renderShell();
    const { trigger, drawer } = await openDrawer(user);

    // The trigger sits behind the scrim, which is exactly the mistake the trap
    // exists to correct.
    trigger.focus();
    expect(drawer.contains(document.activeElement)).toBe(false);

    pressTab();

    expect(drawer.contains(document.activeElement)).toBe(true);
  });

  it("closes on the scrim and on a chosen destination", async () => {
    const user = userEvent.setup();
    renderShell();
    const { drawer } = await openDrawer(user);

    await user.click(drawer.parentElement.firstElementChild);
    expect(screen.queryByRole("dialog")).toBeNull();

    const reopened = await openDrawer(user);
    await user.click(within(reopened.drawer).getAllByRole("link")[1]);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("route")).toHaveTextContent("/monitoring");
  });
});

describe("SHELL-07: the account menu is a real disclosure", () => {
  const trigger = () => document.querySelector('[aria-controls="account-menu"]');
  const menu = () => screen.getByRole("group", { name: /menu akun|akun/i });

  it("opens on the trigger, balances aria-expanded, and holds the two account acts", async () => {
    const user = userEvent.setup();
    const { container } = renderShell({ userName: "Noor Hidayah" });

    expect(document.getElementById("account-menu")).toBeNull();

    await user.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("account-menu")).not.toBeNull();

    const menuEl = menu();
    // The menu owns exactly two account acts: the profile destination and the
    // shell's one destructive control.
    expect(menuEl.querySelectorAll('a[href="/profile"]').length).toBe(1);
    expect(within(menuEl).getAllByRole("button", { name: /keluar/i }).length).toBe(1);

    // The signed-in name reaches the trigger, so the menu is discoverable
    // without opening it.
    expect(container.querySelector('[aria-controls="account-menu"]').textContent).toMatch(
      /noor/i
    );

    await user.keyboard("{Escape}");
    expect(document.getElementById("account-menu")).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger());
  });

  it("closes when the pointer lands outside it", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(trigger());
    expect(document.getElementById("account-menu")).not.toBeNull();

    await user.click(screen.getByTestId("route"));
    expect(document.getElementById("account-menu")).toBeNull();
  });
});

describe("SHELL-06: labels, and no motion the dial forbids", () => {
  it("gives every control in the shell an accessible name", () => {
    const { container } = renderShell({ hasUnread: true });

    // A control named only by its icon reads as "button" to a screen reader, so
    // every icon-only control in the shell carries an sr-only sentence.
    const unnamed = Array.from(container.querySelectorAll("button, a[href]")).filter(
      (el) =>
        !el.getAttribute("aria-label") && el.textContent.trim() === ""
    );

    expect(unnamed.map((el) => el.outerHTML.slice(0, 72))).toEqual([]);
  });

  it("names the pillar nav and the drawer rather than leaving two anonymous lists", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(pill()).toHaveAccessibleName();

    await user.click(document.querySelector('[aria-controls="nav-drawer"]'));
    expect(screen.getByRole("dialog")).toHaveAccessibleName();
  });

  it("animates nothing, anywhere in the shipped sources", () => {
    // MOTION 1 permits hover, focus, value transitions, the heatmap's danger
    // pulse and one reduced-motion-aware scroll. A Tailwind `animate-*` utility
    // is none of those: it is motion that runs on its own, which is exactly what
    // competes with numbers that update every second.
    expect(FILES.length, "the walk collected no sources").toBeGreaterThan(40);
    expect(FILES.some((file) => file.endsWith("AppLayout.jsx"))).toBe(true);

    const offenders = [];
    for (const file of FILES) {
      const text = stripComments(fs.readFileSync(file, "utf8"));
      for (const match of text.matchAll(/\banimate-[a-z0-9[\].%/()-]+/gi)) {
        offenders.push(`${path.relative(SRC, file)}: ${match[0]}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps the splash's announcement, which is what now carries its meaning", () => {
    const app = read("App.jsx");
    const splash = app.slice(app.indexOf("const Splash"));

    expect(splash).toMatch(/role="status"/);
    expect(splash).toMatch(/app\.loading/);
    expect(splash).not.toMatch(/animate-/);
  });
});

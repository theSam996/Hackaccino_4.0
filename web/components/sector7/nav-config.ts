export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Command", icon: "security" },
  { href: "/log", label: "Log", icon: "terminal" },
  { href: "/telemetry", label: "Telemetry", icon: "monitoring" },
  { href: "/network", label: "Network", icon: "hub" },
  { href: "/sensors", label: "Sensors", icon: "videocam" },
  { href: "/reactor", label: "Reactor", icon: "power" },
  { href: "/events", label: "Events", icon: "list_alt" },
  { href: "/guide", label: "Guide", icon: "menu_book" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/logout", label: "Log Out", icon: "logout" },
];

export function titleForPath(pathname: string): string {
  const all = [...PRIMARY_NAV, ...SECONDARY_NAV];
  const hit = all.find((n) => n.href === pathname);
  return hit?.label ?? "Command";
}

import {
  LayoutDashboardIcon,
  ReceiptTextIcon,
  UsersIcon,
  SparklesIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

// Canonical nav definition. Keys match `nav.*` translation namespaces
// so both the sidebar and mobile drawer render the same labels.
// `href` is the locale-less path; the LocaleLink wraps it with the
// active locale prefix at render time.
export type NavItem = {
  key: "overview" | "transactions" | "customers" | "agent" | "settings";
  href: string;
  icon: LucideIcon;
};

export const navItems: readonly NavItem[] = [
  { key: "overview", href: "/", icon: LayoutDashboardIcon },
  { key: "transactions", href: "/transactions", icon: ReceiptTextIcon },
  { key: "customers", href: "/customers", icon: UsersIcon },
  { key: "agent", href: "/agent", icon: SparklesIcon },
  { key: "settings", href: "/settings", icon: SettingsIcon },
] as const;

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Bot,
  CircleHelp,
  House,
  Inbox,
  Kanban,
  Megaphone,
  Radio,
  Settings,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const primaryNav: NavItem[] = [
  { href: "inicio", label: "Inicio", icon: House },
  { href: "bandeja", label: "Bandeja", icon: Inbox },
  { href: "contactos", label: "Contactos", icon: Users },
  { href: "pipeline", label: "Pipeline", icon: Kanban },
  { href: "agente", label: "Agente IA", icon: Bot },
  { href: "canales", label: "Canales", icon: Radio },
  { href: "campanas", label: "Campañas", icon: Megaphone },
  { href: "informes", label: "Informes", icon: BarChart3 },
];

export const secondaryNav: NavItem[] = [
  { href: "ajustes", label: "Ajustes", icon: Settings },
  { href: "ayuda", label: "Ayuda", icon: CircleHelp },
  { href: "notificaciones", label: "Notificaciones", icon: Bell },
];

export function tenantPath(tenantId: string, href: string): string {
  return `/t/${tenantId}/${href}`;
}

export function isActivePath(pathname: string, tenantId: string, href: string): boolean {
  return pathname === tenantPath(tenantId, href) || pathname.startsWith(`${tenantPath(tenantId, href)}/`);
}

export function formatHeaderDate(now = new Date()): string {
  const formatted = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

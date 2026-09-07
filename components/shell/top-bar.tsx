import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatHeaderDate } from "@/lib/navigation";
import { Menu, Plus, Search } from "lucide-react";

export function TopBar({
  title,
  onOpenMenu,
}: {
  title: string;
  onOpenMenu: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          aria-label="Abrir menú"
          onClick={onOpenMenu}
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted">{formatHeaderDate()}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-3 lg:max-w-xl lg:justify-end">
        <div className="min-w-0 flex-1">
          <Input
            name="search"
            placeholder="Buscar"
            aria-label="Buscar"
            leadingIcon={<Search className="size-4" />}
          />
        </div>
        <Button
          variant="primary"
          leadingIcon={<Plus className="size-4" />}
          disabled
          title="Las conversaciones las construye el equipo de canales"
        >
          Nueva conversación
        </Button>
      </div>
    </header>
  );
}

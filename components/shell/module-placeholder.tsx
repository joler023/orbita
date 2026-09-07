import { EmptyState } from "@/components/ui/empty-state";
import type { LucideIcon } from "lucide-react";

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <EmptyState icon={<Icon className="size-8" />} title={title} description={description} />
  );
}

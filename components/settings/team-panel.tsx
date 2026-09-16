"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { PermissionState } from "@/components/ui/permission-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { canManageTeam, type MemberRole } from "@/lib/api/auth";
import { ApiError, toUserMessage } from "@/lib/api/errors";
import {
  changeTeamMemberRole,
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  resendInvitation,
  revokeInvitation,
  type TeamMember,
} from "@/lib/api/team";
import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { InviteMemberModal } from "./invite-member-modal";
import { ASSIGNABLE_ROLES, ROLE_LABEL } from "./role-labels";

type LoadState = "loading" | "ready" | "forbidden" | "error";

export function TeamPanel({ tenantId, viewerRole }: { tenantId: string; viewerRole: MemberRole }) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<TeamMember | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canManage = canManageTeam(viewerRole);

  useEffect(() => {
    let cancelled = false;
    listTeamMembers(tenantId)
      .then((result) => {
        if (!cancelled) {
          setMembers(result);
          setState("ready");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(error instanceof ApiError && error.status === 403 ? "forbidden" : "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, reloadKey]);

  const replace = (membershipId: string, updated: TeamMember | null) => {
    setMembers((current) =>
      updated
        ? current.map((member) => (member.membershipId === membershipId ? updated : member))
        : current.filter((member) => member.membershipId !== membershipId),
    );
  };

  const invite = async (email: string, role: MemberRole) => {
    const invited = await inviteTeamMember(tenantId, email, role);
    setMembers((current) => [...current, invited]);
    notify(`Invitamos a ${email} como ${ROLE_LABEL[role].toLowerCase()}.`, "success");
  };

  const resend = async (member: TeamMember) => {
    setBusyId(member.membershipId);
    try {
      replace(member.membershipId, await resendInvitation(tenantId, member.membershipId));
      notify(`Reenviamos la invitación a ${member.email}.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (member: TeamMember) => {
    setBusyId(member.membershipId);
    try {
      await revokeInvitation(tenantId, member.membershipId);
      replace(member.membershipId, null);
      notify(`Revocamos la invitación a ${member.email}.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (member: TeamMember, role: MemberRole) => {
    setBusyId(member.membershipId);
    try {
      replace(member.membershipId, await changeTeamMemberRole(tenantId, member.membershipId, role));
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!pendingRemoval) {
      return;
    }
    const member = pendingRemoval;
    try {
      await removeTeamMember(tenantId, member.membershipId);
      replace(member.membershipId, null);
      notify(`${member.fullName} ya no pertenece a tu equipo.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setPendingRemoval(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando el equipo">
        <Skeleton className="h-11" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <PermissionState
        title="Necesitas permiso para ver el equipo"
        description="Solo el dueño o un administrador pueden ver y gestionar quién pertenece a la organización."
      />
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar tu equipo"
        description="Revisa tu conexión. Si sigue pasando, vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {members.length} {members.length === 1 ? "persona" : "personas"} en tu organización. Sin límite de
          asientos.
        </p>
        {canManage ? (
          <Button size="sm" leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setInviteOpen(true)}>
            Invitar
          </Button>
        ) : null}
      </div>

      {members.length <= 1 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
          <Users className="size-8 text-orbita-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Todavía es solo tu organización</h2>
          <p className="max-w-md text-sm text-muted">
            Invita a tu equipo para que atiendan conversaciones sin compartir tu contraseña.
          </p>
        </div>
      ) : (
        <Table
          caption="Miembros del equipo"
          columns={[
            { key: "person", header: "Persona" },
            { key: "role", header: "Rol" },
            { key: "status", header: "Estado" },
            { key: "actions", header: "", className: "text-right" },
          ]}
        >
          {members.map((member) => (
            <tr key={member.membershipId} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{member.isPending ? member.email : member.fullName}</p>
                {member.isPending ? null : <p className="text-xs text-muted">{member.email}</p>}
              </td>
              <td className="px-4 py-3">
                {canManage && !member.isPending && member.role !== "Owner" ? (
                  <select
                    aria-label={`Rol de ${member.fullName}`}
                    value={member.role}
                    disabled={busyId === member.membershipId}
                    onChange={(event) => void changeRole(member, event.target.value as MemberRole)}
                    className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
                  >
                    {ASSIGNABLE_ROLES.filter((role) => role !== "Owner").map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-foreground">{ROLE_LABEL[member.role]}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {member.isPending ? (
                  <StatusBadge tone="warning" label="Invitación pendiente" />
                ) : (
                  <StatusBadge tone="success" label="Activo" />
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {!canManage ? null : member.isPending ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" disabled={busyId === member.membershipId} onClick={() => void resend(member)}>
                      Reenviar
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busyId === member.membershipId} onClick={() => void revoke(member)}>
                      Revocar
                    </Button>
                  </div>
                ) : member.role === "Owner" ? null : (
                  <Button size="sm" variant="ghost" onClick={() => setPendingRemoval(member)}>
                    Quitar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={invite} />
      <ConfirmDialog
        open={pendingRemoval !== null}
        title={`¿Quitar a ${pendingRemoval?.fullName ?? "esta persona"}?`}
        consequence="Perderá el acceso a esta organización de inmediato. Puedes volver a invitarla más adelante."
        confirmLabel="Quitar del equipo"
        destructive
        onConfirm={confirmRemove}
        onClose={() => setPendingRemoval(null)}
      />
    </div>
  );
}

import { RecoverForm } from "@/components/auth/recover-form";

export default function RecoverPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-muted">Te enviamos un enlace si el correo está registrado.</p>
      <RecoverForm />
    </>
  );
}

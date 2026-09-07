import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Crear organización</h1>
      <p className="mb-6 text-sm text-muted">Empieza con el nombre de tu negocio. El resto se configura después.</p>
      <RegisterForm />
    </>
  );
}

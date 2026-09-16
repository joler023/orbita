import Link from "next/link";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; body: string }> = {
  "whatsapp-para-el-equipo": {
    title: "Por qué el WhatsApp del negocio no puede vivir en un solo teléfono",
    body: "Borrador. Aquí irá el artículo completo cuando marketing lo entregue.",
  },
  "cobro-por-consumo": {
    title: "Cómo explicar el cobro por consumo sin asustar al cliente",
    body: "Borrador. El simulador de /precios es el apoyo visual de este argumento.",
  },
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) {
    notFound();
  }

  return (
    <article className="flex flex-col gap-4">
      <Link href="/blog" className="text-sm text-orbita-700 hover:underline">
        ← Blog
      </Link>
      <h1 className="text-3xl font-semibold text-orbita-900">{post.title}</h1>
      <p className="text-muted">{post.body}</p>
    </article>
  );
}

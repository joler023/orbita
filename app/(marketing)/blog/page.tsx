import Link from "next/link";

const posts = [
  {
    slug: "whatsapp-para-el-equipo",
    title: "Por qué el WhatsApp del negocio no puede vivir en un solo teléfono",
  },
  {
    slug: "cobro-por-consumo",
    title: "Cómo explicar el cobro por consumo sin asustar al cliente",
  },
] as const;

export default function BlogPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Borrador · Blog</p>
      <h1 className="text-3xl font-semibold text-orbita-900">Blog</h1>
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="font-medium text-orbita-700 hover:underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

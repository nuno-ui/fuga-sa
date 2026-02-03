import FugaApp from "@/components/FugaApp";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FugaApp slug={slug} />;
}

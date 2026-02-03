import FugaApp from "@/components/FugaApp";
import CreateGroup from "@/components/CreateGroup";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Handle /create route if caught by dynamic route
  if (slug === "create") {
    return <CreateGroup />;
  }

  return <FugaApp slug={slug} />;
}

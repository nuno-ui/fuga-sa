import dynamic from "next/dynamic";
import FugaApp from "@/components/FugaApp";

// Dynamically import the create page component
const CreateGroupPage = dynamic(() => import("@/app/create/page"), { ssr: true });

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Handle /create route if it's caught here
  if (slug.toLowerCase() === "create") {
    return <CreateGroupPage />;
  }

  return <FugaApp slug={slug} />;
}

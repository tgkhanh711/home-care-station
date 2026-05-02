import { AiChatPage } from "@/components/ai/ai-chat-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StationAiChatPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  return <AiChatPage role="station" searchParams={params} />;
}
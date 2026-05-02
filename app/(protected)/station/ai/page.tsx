import { AiCarePage } from "@/components/ai/ai-care-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StationAiPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  return <AiCarePage role="station" searchParams={params} />;
}
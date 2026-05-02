import { AiCarePage } from "@/components/ai/ai-care-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CaregiverAiPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  return <AiCarePage role="caregiver" searchParams={params} />;
}
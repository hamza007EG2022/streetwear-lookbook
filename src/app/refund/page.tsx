import { getData } from "@/lib/store";
import { stripSensitiveData } from "@/lib/public-data";
import StaticPageShell from "../sizing/StaticPageShell";

export const dynamic = "force-dynamic";

export default async function RefundPage() {
  const fullData = await getData();
  const publicData = stripSensitiveData(fullData);
  return <StaticPageShell data={publicData} pageKey="refund" />;
}

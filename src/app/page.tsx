import { getData } from "@/lib/store";
import { stripSensitiveData } from "@/lib/public-data";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const fullData = await getData();
  const publicData = stripSensitiveData(fullData);
  return <HomeClient initialData={publicData} />;
}

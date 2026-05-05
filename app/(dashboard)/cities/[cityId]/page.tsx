import CityView from "@/components/cities/CityView";
import { getCityById } from "@/lib/actions/lead.actions";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ cityId: string }>;
}

export default async function CityDetailPage({ params }: Props) {
  const { cityId } = await params;
  
  if (!cityId) {
    notFound();
  }
  
  let city;
  try {
    city = await getCityById(cityId);
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.1)]">
        <CityView city={city} />
      </div>
    </div>
  );
}

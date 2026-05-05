import CityList from "@/components/cities/CityList";
import { getCities } from "@/lib/actions/lead.actions";

export default async function CitiesPage() {
  const cities = await getCities();

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.1),0_1px_10px_0_rgb(0,0,0,0.05)] border border-slate-200">
        <CityList initialCities={cities} />
      </div>
    </div>
  );
}


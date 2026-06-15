import { Skeleton } from "@/components/ui/skeleton";

export default function TabRaceLoading() {
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm w-full">
      <div className="flex justify-between items-center mb-6 gap-0.5">
        <Skeleton className="h-14 w-32 sm:h-7 sm:w-64" />

        <Skeleton className="h-9 w-40 rounded-full!" />
      </div>
      <div className="w-full">
        <div className="flex justify-between w-full h-10 border-b px-4">
          <div className="flex justify-between gap-4 w-[25%]">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-15" />
          </div>
          <div>
            <Skeleton className="h-5 w-15" />
          </div>
        </div>

        <div className="px-4 py-7 space-y-8">
          {skeletonRows.map((_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

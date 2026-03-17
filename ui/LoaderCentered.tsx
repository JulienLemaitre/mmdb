import Loader from "@/ui/Loader";

export function LoaderCentered() {
  return (
    <div className="flex w-full h-full items-center justify-center">
      <Loader />
    </div>
  );
}

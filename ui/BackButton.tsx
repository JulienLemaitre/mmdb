import { useRouter } from "next/navigation";
import ArrowLeftIcon from "@/ui/svg/ArrowLeftIcon";

export default function BackButton() {
  const router = useRouter();
  return (
    <button className="btn btn-outline mt-6 px-8" onClick={() => router.back()}>
      <ArrowLeftIcon className="w-5 h-5 mr-2" />
      Back
    </button>
  );
}

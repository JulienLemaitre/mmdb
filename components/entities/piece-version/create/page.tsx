import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";

export default function CreatePieceVersion() {
  return <PieceVersionEditForm onSubmit={() => console.log("submit")} />;
}

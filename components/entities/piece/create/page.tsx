import PieceEditForm from "../PieceEditForm";

export default function CreatePiece() {
  return <PieceEditForm onSubmit={() => console.log("submit")} />;
}

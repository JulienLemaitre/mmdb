"use client";
import Link from "next/link";

import ComposerSelect from "@/components/ComposerSelect";
import { useEditForm } from "@/components/context/editFormContext";
import { EDITION_PIECE_URL } from "@/utils/routes";
import { ComposerState } from "@/types/editFormTypes";

type ComposerSelectFormProps = {
  composers: ComposerState[];
};
export default function ComposerSelectForm({
  composers,
}: ComposerSelectFormProps) {
  const { state } = useEditForm();

  return (
    <>
      <ComposerSelect composers={composers} />
      <Link
        href={EDITION_PIECE_URL + "?composerId=" + state?.composer?.id}
        className="btn btn-primary mt-4"
        {...(state.composer?.id ? { disabled: false } : { disabled: true })}
      >
        Next
      </Link>
    </>
  );
}

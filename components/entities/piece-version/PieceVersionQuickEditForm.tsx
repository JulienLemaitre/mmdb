"use client";

import { useForm } from "react-hook-form";
import { PIECE_CATEGORY } from "@prisma/client";

export type PieceVersionQuickValues = {
  id: string;
  category?: string | null;
};

export default function PieceVersionQuickEditForm({
  initialValues,
  onSubmit,
  onCancel,
}: Readonly<{
  initialValues: PieceVersionQuickValues;
  onSubmit: (values: PieceVersionQuickValues) => void;
  onCancel: () => void;
}>) {
  const { register, handleSubmit, formState } = useForm<PieceVersionQuickValues>({
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <label className="form-control">
        <div className="label"><span className="label-text">Category</span></div>
        <select className="select select-bordered" {...register("category")}>
          {Object.values(PIECE_CATEGORY).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3 pt-2">
        <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={formState.isSubmitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={formState.isSubmitting}>
          Save
          {formState.isSubmitting && <span className="loading loading-spinner loading-sm ml-2"></span>}
        </button>
      </div>
    </form>
  );
}

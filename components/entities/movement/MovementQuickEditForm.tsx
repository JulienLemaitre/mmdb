"use client";

import { useForm } from "react-hook-form";
import { KEY } from "@prisma/client";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

export type MovementQuickValues = {
  id: string;
  rank?: number | null;
  key?: keyof typeof KEY | string | null;
};

export default function MovementQuickEditForm({
  initialValues,
  onSubmit,
  onCancel,
}: Readonly<{
  initialValues: MovementQuickValues;
  onSubmit: (values: MovementQuickValues) => void;
  onCancel: () => void;
}>) {
  const { register, handleSubmit, formState } = useForm<MovementQuickValues>({
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="form-control">
          <div className="label"><span className="label-text">Rank</span></div>
          <input type="number" className="input input-bordered" {...register("rank", { valueAsNumber: true })} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Key</span></div>
          <select className="select select-bordered" {...register("key")}> 
            {Object.values(KEY).map((k) => (
              <option key={k} value={k}>{formatToPhraseCase(k)}</option>
            ))}
          </select>
        </label>
      </div>
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

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import getTempoIndicationSelectList from "@/utils/getTempoIndicationSelectList";
import { SectionDetail } from "@/components/entities/section/SectionDetail";

export type SectionQuickValues = {
  id: string;
  rank?: number | null;
  metreNumerator?: number | null;
  metreDenominator?: number | null;
  isCommonTime?: boolean | null;
  isCutTime?: boolean | null;
  fastestStructuralNotesPerBar?: number | null;
  fastestStaccatoNotesPerBar?: number | null;
  fastestRepeatedNotesPerBar?: number | null;
  fastestOrnamentalNotesPerBar?: number | null;
  isFastestStructuralNoteBelCanto?: boolean | null;
  tempoIndicationId?: string | null;
  comment?: string | null;
  commentForReview?: string | null;
};

export default function SectionQuickEditForm({
  initialValues,
  onSubmit,
  onCancel,
  readonlyPreview,
}: Readonly<{
  initialValues: SectionQuickValues;
  onSubmit: (values: SectionQuickValues) => void;
  onCancel: () => void;
  readonlyPreview?: any; // optional section object for SectionDetail preview
}>) {
  const { register, handleSubmit, formState, setValue, watch } = useForm<SectionQuickValues>({
    defaultValues: initialValues,
  });
  const [tempoIndications, setTempoIndications] = useState<Array<{ id: string; text: string }>>([]);

  useEffect(() => {
    getTempoIndicationSelectList()
      .then((list: any[]) => setTempoIndications(list.map((ti) => ({ id: ti.id, text: ti.text }))))
      .catch(() => setTempoIndications([]));
  }, []);

  const isMetreDisabled = watch("isCommonTime") || watch("isCutTime");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {readonlyPreview && (
        <div className="mb-2">
          <SectionDetail section={readonlyPreview} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="form-control">
          <div className="label"><span className="label-text">Rank</span></div>
          <input type="number" className="input input-bordered" {...register("rank", { valueAsNumber: true })} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="form-control">
            <div className="label"><span className="label-text">Metre num</span></div>
            <input type="number" className="input input-bordered" disabled={!!isMetreDisabled} {...register("metreNumerator", { valueAsNumber: true })} />
          </label>
          <div className="flex items-end justify-center pb-3">/</div>
          <label className="form-control">
            <div className="label"><span className="label-text">Metre den</span></div>
            <input type="number" className="input input-bordered" disabled={!!isMetreDisabled} {...register("metreDenominator", { valueAsNumber: true })} />
          </label>
        </div>
        <label className="label cursor-pointer">
          <span className="label-text">Common time (C)</span>
          <input type="checkbox" className="toggle" {...register("isCommonTime")} />
        </label>
        <label className="label cursor-pointer">
          <span className="label-text">Cut time (¢)</span>
          <input type="checkbox" className="toggle" {...register("isCutTime")} />
        </label>
        <label className="form-control md:col-span-2">
          <div className="label"><span className="label-text">Tempo indication</span></div>
          <select className="select select-bordered" {...register("tempoIndicationId")}>
            <option value="">—</option>
            {tempoIndications.map((ti) => (
              <option key={ti.id} value={ti.id}>{ti.text}</option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Structural notes/bar</span></div>
          <input type="number" className="input input-bordered" {...register("fastestStructuralNotesPerBar", { valueAsNumber: true })} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Staccato notes/bar</span></div>
          <input type="number" className="input input-bordered" {...register("fastestStaccatoNotesPerBar", { valueAsNumber: true })} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Repeated notes/bar</span></div>
          <input type="number" className="input input-bordered" {...register("fastestRepeatedNotesPerBar", { valueAsNumber: true })} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Ornamental notes/bar</span></div>
          <input type="number" className="input input-bordered" {...register("fastestOrnamentalNotesPerBar", { valueAsNumber: true })} />
        </label>
        <label className="label cursor-pointer">
          <span className="label-text">Structural note is bel canto</span>
          <input type="checkbox" className="toggle" {...register("isFastestStructuralNoteBelCanto")} />
        </label>
        <label className="form-control md:col-span-2">
          <div className="label"><span className="label-text">Comment</span></div>
          <textarea className="textarea textarea-bordered" rows={2} {...register("comment")} />
        </label>
        <label className="form-control md:col-span-2">
          <div className="label"><span className="label-text">Reviewer-only comment</span></div>
          <textarea className="textarea textarea-bordered" rows={2} {...register("commentForReview")} />
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

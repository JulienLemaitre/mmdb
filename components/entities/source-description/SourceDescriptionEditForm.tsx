"use client";

import { useForm } from "react-hook-form";

export type SourceDescriptionFormValues = {
  title?: string | null;
  type?: string | null;
  link?: string | null;
  permalink?: string | null;
  year?: number | null;
  comment?: string | null;
};

export default function SourceDescriptionEditForm({
  initialValues,
  onSubmit,
  onCancel,
}: Readonly<{
  initialValues: SourceDescriptionFormValues;
  onSubmit: (values: SourceDescriptionFormValues) => void;
  onCancel: () => void;
}>) {
  const { register, handleSubmit, formState } = useForm<SourceDescriptionFormValues>({
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="form-control">
          <div className="label"><span className="label-text">Title</span></div>
          <input className="input input-bordered" {...register("title")} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Type</span></div>
          <input className="input input-bordered" {...register("type")} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Link</span></div>
          <input className="input input-bordered" {...register("link")} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Permalink</span></div>
          <input className="input input-bordered" {...register("permalink")} />
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Publication year</span></div>
          <input type="number" className="input input-bordered" {...register("year", { valueAsNumber: true })} />
        </label>
        <label className="form-control md:col-span-2">
          <div className="label"><span className="label-text">Comment</span></div>
          <textarea className="textarea textarea-bordered" rows={3} {...register("comment")} />
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

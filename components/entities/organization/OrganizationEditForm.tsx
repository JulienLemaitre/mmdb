"use client";

import { useForm } from "react-hook-form";

export type OrganizationFormValues = {
  id?: string;
  name?: string | null;
};

export default function OrganizationEditForm({
  initialValues,
  onSubmit,
  onCancel,
}: Readonly<{
  initialValues: OrganizationFormValues;
  onSubmit: (values: OrganizationFormValues) => void;
  onCancel: () => void;
}>) {
  const { register, handleSubmit, formState } = useForm<OrganizationFormValues>({
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <label className="form-control">
          <div className="label"><span className="label-text">Organization name</span></div>
          <input className="input input-bordered" {...register("name")} />
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

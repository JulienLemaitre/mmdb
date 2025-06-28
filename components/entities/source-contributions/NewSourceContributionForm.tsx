import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { ContributionInput } from "@/types/formTypes";
import { CONTRIBUTION_ROLE } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getZodOptionFromEnum, zodPerson } from "@/types/zodTypes";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import { FormInput, getLabel } from "@/components/ReactHookForm/FormInput";
import { ChangeEvent, useState } from "react";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import getRoleLabel from "@/utils/getRoleLabel";

const SourceContributionsSchema = z.union([
  z.object({
    person: zodPerson,
    role: getZodOptionFromEnum(CONTRIBUTION_ROLE),
  }),
  z.object({
    organization: z.object({
      name: z.string().min(2),
    }),
    role: getZodOptionFromEnum(CONTRIBUTION_ROLE),
  }),
]);

export default function NewSourceContributionForm({ onContributionCreated }) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    control,
  } = useForm({
    // defaultValues: {},
    resolver: zodResolver(SourceContributionsSchema),
  });
  const { dispatch: feedFormDispatch } = useFeedForm();
  const [isPerson, setIsPerson] = useState<boolean>(true);

  const onIsOrganizationToggleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const isOrganization = event.target.value === "on";
    setIsPerson((v) => !v);
    if (!isOrganization) {
      // @ts-ignore
      setValue("person", undefined);
      // @ts-ignore
      setValue("organization", {});
    } else {
      // @ts-ignore
      setValue("organization", undefined);
      // @ts-ignore
      setValue("person", {});
    }
  };

  const onSubmit = async (data: ContributionInput) => {
    console.log(`[] data :`, data);
    if ("person" in data) {
      // Persist the new person in state
      const newPerson = {
        id: uuidv4(),
        birthYear: data.person.birthYear,
        ...(!Number.isNaN(data.person?.deathYear)
          ? { deathYear: data.person.deathYear }
          : {}),
        firstName: data.person.firstName,
        lastName: data.person.lastName,
        isNew: true,
      };

      updateFeedForm(feedFormDispatch, "persons", {
        array: [newPerson],
      });

      onContributionCreated({
        role: data.role.value,
        person: newPerson,
      });
    }
    if ("organization" in data) {
      // Persist the new organization in state
      const newOrganization = {
        id: uuidv4(),
        name: data.organization.name,
        isNew: true,
      };
      updateFeedForm(feedFormDispatch, "organizations", {
        array: [newOrganization],
      });

      onContributionCreated({
        role: data.role.value,
        organization: newOrganization,
      });
    }
  };

  return (
    <>
      <div>{`Create a new source contributor`}</div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <ControlledSelect
          name="role"
          label="Role"
          id="role"
          control={control}
          options={Object.values(CONTRIBUTION_ROLE).map((category) => ({
            value: category,
            label: getRoleLabel(category),
          }))}
          isRequired={true}
        />

        <div className="form-control w-52">
          <label className="cursor-pointer label">
            <span className="label-text">Person</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={!isPerson}
              onChange={onIsOrganizationToggleChange}
            />
            <span className="label-text">Organization</span>
          </label>
        </div>

        {isPerson ? (
          <>
            <FormInput
              name={`person.firstName` as const}
              label={getLabel("firstName")}
              isRequired
              {...{ register, control, errors }}
            />
            <FormInput
              name={`person.lastName` as const}
              label={getLabel("lastName")}
              isRequired
              {...{ register, control, errors }}
            />
            <FormInput
              name={`person.birthYear` as const}
              label={getLabel("birthYear")}
              isRequired
              {...{ register, control, errors }}
            />
            <FormInput
              name={`person.deathYear` as const}
              label={getLabel("deathYear")}
              {...{ register, control, errors }}
            />
          </>
        ) : (
          <FormInput
            name={`organization.name` as const}
            isRequired
            label="Organization name"
            {...{ register, control, errors }}
          />
        )}
        <button
          className="btn btn-primary mt-6 w-full max-w-xs"
          type="submit"
          disabled={isSubmitting}
        >
          Submit
          {isSubmitting && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
        </button>
      </form>
    </>
  );
}

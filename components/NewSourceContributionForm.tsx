import { useForm } from "react-hook-form";
import { ContributionInput } from "@/types/editFormTypes";
import { CONTRIBUTION_ROLE } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { zodPerson } from "@/utils/zodTypes";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import { FormInput, getLabel } from "@/components/ReactHookForm/FormInput";
import { ChangeEvent, useState } from "react";

const SourceContributionsSchema = z.union([
  z.object({
    person: zodPerson,
    role: z.object({
      value: z.nativeEnum(CONTRIBUTION_ROLE),
      label: z.nativeEnum(CONTRIBUTION_ROLE),
    }),
  }),
  z.object({
    organization: z.object({
      name: z.string().min(2),
    }),
    role: z.object({
      value: z.nativeEnum(CONTRIBUTION_ROLE),
      label: z.nativeEnum(CONTRIBUTION_ROLE),
    }),
  }),
]);

export default function NewSourceContributionForm({ onContributionCreated }) {
  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    setValue,
    watch,
    control,
  } = useForm<ContributionInput>({
    // defaultValues: {},
    resolver: zodResolver(SourceContributionsSchema),
  });
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
      // Persist the new person
      const person = await fetch("/api/person/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.person),
      })
        .then((res) => res.json())
        .catch((err) => console.log(err));

      console.log(`person created :`, person);
      onContributionCreated({
        role: data.role.value,
        person,
      });
    }
    if ("organization" in data) {
      // Persist the new organization
      const organization = await fetch("/api/organization/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.organization),
      })
        .then((res) => res.json())
        .catch((err) => console.log(err));

      console.log(`organization created :`, organization);
      onContributionCreated({
        role: data.role,
        organization,
      });
    }
  };

  return (
    <>
      <div>{`Create a new source contributor`}</div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <ControlledSelect
          name="role"
          label="Role"
          id="role"
          control={control}
          options={Object.values(CONTRIBUTION_ROLE).map((category) => ({
            value: category,
            label: category,
          }))}
          isRequired={true}
          errors={errors}
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
              {...{ register, watch, errors }}
            />
            <FormInput
              name={`person.lastName` as const}
              label={getLabel("lastName")}
              isRequired
              {...{ register, watch, errors }}
            />
            <FormInput
              name={`person.birthYear` as const}
              label={getLabel("birthYear")}
              isRequired
              {...{ register, watch, errors }}
            />
            <FormInput
              name={`person.deathYear` as const}
              label={getLabel("deathYear")}
              {...{ register, watch, errors }}
            />
          </>
        ) : (
          <FormInput
            name={`organization.name` as const}
            isRequired
            label="Organization name"
            {...{ register, watch, errors }}
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

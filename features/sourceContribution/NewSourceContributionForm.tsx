import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import {
  ContributionInput,
  OrganizationState,
  PersonState,
} from "@/types/formTypes";
import { CONTRIBUTION_ROLE } from "@/prisma/client/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getZodOptionFromEnum, zodPerson } from "@/types/zodTypes";
import ControlledSelect from "@/ui/form/ControlledSelect";
import { FormInput, getLabel } from "@/ui/form/FormInput";
import { ChangeEvent, useState } from "react";
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

type NewSourceContributionFormProps = {
  onContributionCreated: (
    result:
      | { kind: "person"; person: PersonState; role: CONTRIBUTION_ROLE }
      | {
          kind: "organization";
          organization: OrganizationState;
          role: CONTRIBUTION_ROLE;
        },
  ) => void;
};

export default function NewSourceContributionForm({
  onContributionCreated,
}: Readonly<NewSourceContributionFormProps>) {
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
  const [isPerson, setIsPerson] = useState<boolean>(true);

  const onIsOrganizationToggleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const isOrganization = event.target.value === "on";
    setIsPerson((v) => !v);
    if (isOrganization) {
      // @ts-ignore
      setValue("organization", undefined);
      // @ts-ignore
      setValue("person", {});
    } else {
      // @ts-ignore
      setValue("person", undefined);
      // @ts-ignore
      setValue("organization", {});
    }
  };

  const onSubmit = async (data: ContributionInput) => {
    console.log(`[] data :`, data);
    if ("person" in data) {
      // Persist the new person in state
      const newPerson: PersonState = {
        id: uuidv4(),
        birthYear: data.person.birthYear,
        deathYear:
          data.person.deathYear && !Number.isNaN(data.person?.deathYear)
            ? data.person.deathYear
            : null,
        firstName: data.person.firstName,
        lastName: data.person.lastName,
        isNew: true,
      };

      onContributionCreated({
        kind: "person",
        person: newPerson,
        role: data.role.value,
      });
    }
    if ("organization" in data) {
      // Persist the new organization in state
      const newOrganization: OrganizationState = {
        id: uuidv4(),
        name: data.organization.name,
        isNew: true,
      };

      onContributionCreated({
        kind: "organization",
        organization: newOrganization,
        role: data.role.value,
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

        <div className="form-control w-52 mt-4">
          <label className="cursor-pointer label">
            <span className={`label-text ${isPerson && "text-primary"}`}>
              Person
            </span>
            <input
              type="checkbox"
              className="toggle border-primary bg-primary text-white/60 checked:bg-secondary checked:border-secondary"
              checked={!isPerson}
              onChange={onIsOrganizationToggleChange}
            />
            <span className={`label-text ${!isPerson && "text-secondary"}`}>
              Organization
            </span>
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

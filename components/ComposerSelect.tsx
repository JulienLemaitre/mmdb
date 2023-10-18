"use client";

type ComposerSelectProps = {
  composers: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
};
export default function ComposerSelect({ composers }: ComposerSelectProps) {
  return (
    <select className="select w-full max-w-xs my-5">
      {composers
        .sort((a, b) => (a.lastName > b.lastName ? 1 : -1))
        .map((person) => (
          <option
            key={person.id}
            value={person.id}
          >{`${person.firstName} ${person.lastName}`}</option>
        ))}
    </select>
  );
}

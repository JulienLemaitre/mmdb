import React, { useState } from "react";
import { TempoIndicationState } from "@/types/formTypes";
import { getLabel } from "@/ui/form/FormInput";

type TempoIndicationSearchProps = {
  tempoIndications: TempoIndicationState[];
  selectedTempoIndications: TempoIndicationState[];
  onSelect: (selected: TempoIndicationState[]) => void;
};

const TempoIndicationSearch: React.FC<TempoIndicationSearchProps> = ({
  tempoIndications,
  selectedTempoIndications,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIndications, setFilteredIndications] = useState<
    TempoIndicationState[]
  >([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setFilteredIndications(
      tempoIndications.filter((indication) =>
        indication.text.toLowerCase().includes(value.toLowerCase()),
      ),
    );
  };

  const handleSelect = (indication: TempoIndicationState) => {
    onSelect([...selectedTempoIndications, indication]);
  };

  const handleDeselect = (indication: TempoIndicationState) => {
    onSelect(selectedTempoIndications.filter((ti) => ti.id !== indication.id));
  };

  const handleSelectAll = (e) => {
    e.preventDefault();
    onSelect(filteredIndications);
  };

  return (
    <div className={`relative form-control w-full mt-2`}>
      <label className="label">
        <span className="label-text">{`Select tempo indications`}</span>
      </label>
      <div className="flex gap-4 items-center mb-1">
        <input
          className={`input input-sm input-bordered max-w-xs flex-1`}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search tempo indications..."
        />
        <button onClick={handleSelectAll} className="btn btn-accent btn-xs">
          Select All
        </button>
      </div>
      {searchTerm.length > 2 ? (
        <ul className="flex flex-wrap gap-1">
          {filteredIndications.map((indication) => {
            const isSelected = selectedTempoIndications.some(
              (selected) => selected.id === indication.id,
            );
            return (
              <li
                key={indication.id}
                onClick={() =>
                  isSelected
                    ? handleDeselect(indication)
                    : handleSelect(indication)
                }
              >
                <div
                  className={`btn btn-xs font-normal text-xs${isSelected ? ` btn-primary` : ""}`}
                >
                  {indication.text}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default TempoIndicationSearch;

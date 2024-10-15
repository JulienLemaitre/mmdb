import React, { useState } from "react";
import { TempoIndicationState } from "@/types/formTypes";

type TempoIndicationSearchProps = {
  tempoIndications: TempoIndicationState[];
  onSelect: (selected: TempoIndicationState[]) => void;
};

const TempoIndicationSearch: React.FC<TempoIndicationSearchProps> = ({ tempoIndications, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIndications, setFilteredIndications] = useState<TempoIndicationState[]>([]);
  const [selectedIndications, setSelectedIndications] = useState<TempoIndicationState[]>([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setFilteredIndications(
      tempoIndications.filter((indication) =>
        indication.text.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handleSelect = (indication: TempoIndicationState) => {
    setSelectedIndications((prev) => [...prev, indication]);
    onSelect([...selectedIndications, indication]);
  };

  const handleSelectAll = () => {
    setSelectedIndications(filteredIndications);
    onSelect(filteredIndications);
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search tempo indications..."
      />
      <button onClick={handleSelectAll}>Select All</button>
      <ul>
        {filteredIndications.map((indication) => (
          <li key={indication.id} onClick={() => handleSelect(indication)}>
            {indication.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TempoIndicationSearch;
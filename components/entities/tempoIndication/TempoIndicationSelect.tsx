// "use client";
import Select from "@/ui/form/reactSelect/Select";
import { TempoIndicationState } from "@/types/formTypes";
// import { useRouter } from "next/navigation";
// import getNoOptionsMessage from "@/components/ReactSelect/getNoOptionsMessage";
// import getPersonName from "@/components/entities/person/utils/getPersonName";

type TempoIndicationSelectProps = {
  tempoIndications: TempoIndicationState[];
  onSelect: (tempoIndicationId: string) => void;
  selectedTempoIndication: TempoIndicationState | null;
  // onTempoIndicationCreationClick: () => void;
};
export default function TempoIndicationSelect({
  tempoIndications,
  onSelect,
  selectedTempoIndication,
  // onTempoIndicationCreationClick,
}: Readonly<TempoIndicationSelectProps>) {
  const tempoIndicationOptions = tempoIndications.map((tempoIndication) =>
    getTempoIndicationOption(tempoIndication),
  );
  // const router = useRouter();
  const defaultOption = selectedTempoIndication
    ? getTempoIndicationOption(selectedTempoIndication)
    : null;

  return (
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
      instanceId="tempoIndication-select"
      placeholder="Enter tempoIndication name..."
      isSearchable={true}
      name="tempoIndication"
      options={tempoIndicationOptions}
      defaultValue={defaultOption}
      autoFocus
      onChange={(tempoIndicationOption) => {
        if (!tempoIndicationOption) return;
        onSelect(tempoIndicationOption?.value);
      }}
      // noOptionsMessage={getNoOptionsMessage({
      //   entityName: "tempoIndication",
      //   onClick: onTempoIndicationCreationClick,
      // })}
    />
  );
}

function getTempoIndicationOption(tempoIndication: TempoIndicationState) {
  return {
    value: tempoIndication.id,
    label: tempoIndication.text,
  };
}

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChecklistRow } from "@/features/review/components/ChecklistRow";

import { RequiredChecklistItem } from "@/types/reviewTypes";

function mkItem(label: string, id: string): RequiredChecklistItem {
  return {
    entityType: "SECTION",
    entityId: id,
    fieldPath: `SECTION:${id}:rank`,
    label,
  };
}

function TestChecklist() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const items = React.useMemo(
    () => [mkItem("First", "s-1"), mkItem("Second", "s-2")],
    [],
  );

  const allChecked = items.every(
    (it) => checked[`${it.entityType}:${it.entityId}:${it.fieldPath}`],
  );

  return (
    <div>
      <table>
        <tbody>
          {items.map((it) => {
            const key = `${it.entityType}:${it.entityId}:${it.fieldPath}`;
            return (
              <ChecklistRow
                key={key}
                item={it}
                checked={!!checked[key]}
                changed={false}
                onToggle={() =>
                  setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                onEdit={() => {}}
                entityBadge={<span className="badge">SECTION</span>}
              />
            );
          })}
        </tbody>
      </table>
      <button type="button" disabled={!allChecked}>
        Submit review
      </button>
    </div>
  );
}

describe("Submit gating (UI)", () => {
  it("disables submit until all required items are checked, then enables", async () => {
    const user = userEvent.setup();
    render(<TestChecklist />);

    const submit = screen.getByRole("button", { name: /submit review/i });
    // Initially disabled
    expect(submit).toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    // Still disabled (not all checked)
    expect(submit).toBeDisabled();

    await user.click(checkboxes[1]);
    // Now enabled
    expect(submit).toBeEnabled();
  });
});

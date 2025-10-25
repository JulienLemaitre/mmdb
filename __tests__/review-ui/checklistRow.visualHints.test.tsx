import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChecklistRow } from "@/features/review/ChecklistRow";
import type { RequiredChecklistItem } from "@/features/review/ReviewChecklistSchema";

function makeItem(
  overrides: Partial<RequiredChecklistItem> = {},
): RequiredChecklistItem {
  return {
    entityType: "SECTION",
    entityId: "sec-1",
    fieldPath: "SECTION:sec-1:rank",
    label: "Section rank",
    ...overrides,
  };
}

describe("ChecklistRow visual hints + a11y", () => {
  it("renders Changed badge and announces state", () => {
    const item = makeItem();
    render(
      <table>
        <tbody>
          <ChecklistRow
            item={item}
            checked={false}
            changed={true}
            onToggle={() => {}}
            onEdit={() => {}}
            entityBadge={<span className="badge">SECTION</span>}
          />
        </tbody>
      </table>,
    );

    // Visible badges
    expect(screen.getByText("Changed")).toBeInTheDocument();
    expect(screen.getByText("Needs check")).toBeInTheDocument();

    // Row aria-label should include both states
    const row = screen.getByRole("row");
    expect(row).toHaveAttribute(
      "aria-label",
      expect.stringContaining("unchecked"),
    );
    expect(row).toHaveAttribute(
      "aria-label",
      expect.stringContaining("changed"),
    );
  });

  it("renders no badges when checked and unchanged", () => {
    const item = makeItem({ label: "Tempo indication" });
    render(
      <table>
        <tbody>
          <ChecklistRow
            item={item}
            checked={true}
            changed={false}
            onToggle={() => {}}
            onEdit={() => {}}
            entityBadge={<span className="badge">SECTION</span>}
          />
        </tbody>
      </table>,
    );

    expect(screen.queryByText("Changed")).not.toBeInTheDocument();
    expect(screen.queryByText("Needs check")).not.toBeInTheDocument();

    // Checkbox has an accessible label tied to the item
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Tempo indication"),
    );
  });

  it("toggle checkbox is interactive", async () => {
    const user = userEvent.setup();
    const item = makeItem({ label: "Metre denominator" });
    const onToggle = jest.fn();
    render(
      <table>
        <tbody>
          <ChecklistRow
            item={item}
            checked={false}
            changed={false}
            onToggle={onToggle}
            onEdit={() => {}}
            entityBadge={<span className="badge">SECTION</span>}
          />
        </tbody>
      </table>,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalled();
  });
});

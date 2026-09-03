import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NewReferenceForm from "@/features/reference/form/NewReferenceForm";
import { REFERENCE_TYPE } from "@/prisma/client/enums";

// Mock ReactSelect to keep test lightweight and deterministic
jest.mock("@/ui/form/reactSelect/Select", () => {
  return function MockSelect({ options, value, onChange, name }: any) {
    return (
      <select
        data-testid={`select-${name}`}
        aria-label={name}
        value={value?.value ?? ""}
        onChange={(e) => {
          const selected = options.find((o: any) => o.value === e.target.value);
          onChange(selected);
        }}
      >
        <option value="">Select...</option>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
});

// Mock DuplicatePlateNumberWarningModal to avoid unneeded modal lifecycle in unit tests
jest.mock("@/ui/modal/DuplicatePlateNumberWarningModal", () => {
  return function MockModal() {
    return null;
  };
});

// Mock fetch for database check
global.fetch = jest.fn();

describe("NewReferenceForm", () => {
  const mockOnReferenceCreated = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => null, // reference does not exist in DB
    });
  });

  it("creates a reference with a generated UUID id", async () => {
    render(
      <NewReferenceForm
        onReferenceCreated={mockOnReferenceCreated}
        onCancel={mockOnCancel}
        currentReferences={[]}
      />,
    );

    // Select type
    const typeSelect = screen.getByTestId("select-type");
    fireEvent.change(typeSelect, {
      target: { value: REFERENCE_TYPE.PLATE_NUMBER },
    });

    // Enter reference value
    const input = screen.getByRole("textbox");
    fireEvent.change(input, {
      target: { value: "VN 5678" },
    });

    // Click submit
    const submitBtn = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnReferenceCreated).toHaveBeenCalledTimes(1);
    });

    const createdRef = mockOnReferenceCreated.mock.calls[0][0];
    expect(createdRef).toBeDefined();
    expect(createdRef.id).toBeDefined();
    expect(typeof createdRef.id).toBe("string");
    expect(createdRef.id.length).toBeGreaterThan(10); // Valid UUID string
    expect(createdRef.type.value).toBe(REFERENCE_TYPE.PLATE_NUMBER);
    expect(createdRef.reference).toBe("VN 5678");
  });
});

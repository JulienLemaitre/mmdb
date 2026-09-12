import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SourceDescriptionEditForm from "@/features/sourceDescription/SourceDescriptionEditForm";
import { SOURCE_TYPE } from "@/prisma/client/enums";

// Mock ControlledSelect to keep test lightweight
jest.mock("@/ui/form/ControlledSelect", () => {
  return function MockControlledSelect({ label, name, options }: any) {
    return (
      <div>
        <label htmlFor={name}>{label}</label>
        <select data-testid={`select-${name}`} id={name}>
          {options?.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };
});

// Mock MMSourceFormStepNavigation to avoid FeedFormProvider dependency
jest.mock(
  "@/features/feed/multiStepMMSourceForm/MMSourceFormStepNavigation",
  () => {
    return function MockMMSourceFormStepNavigation({
      onSave,
      onSaveAndGoToNextStep,
    }: any) {
      return (
        <div data-testid="step-navigation">
          <button type="button" onClick={onSave}>
            Save
          </button>
          <button type="button" onClick={onSaveAndGoToNextStep}>
            Save and Next
          </button>
        </div>
      );
    };
  },
);

// Mock fetch for permalink existence checks
global.fetch = jest.fn();

describe("SourceDescriptionEditForm - External link button", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => null,
    });
  });

  it("renders external link button in disabled state when link is empty or invalid", () => {
    render(
      <SourceDescriptionEditForm
        onSubmit={mockOnSubmit}
        sourceDescription={{
          type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
          link: "",
          year: 1850,
          isYearEstimated: false,
          noDate: false,
          references: [],
        }}
      />,
    );

    const linkButton = screen.getByRole("link", {
      name: /open score link in new tab/i,
    });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("aria-disabled", "true");
    expect(linkButton).toHaveClass("btn-disabled");
    expect(linkButton).not.toHaveAttribute("href");
  });

  it("enables external link button when initialized with a valid URL", () => {
    render(
      <SourceDescriptionEditForm
        onSubmit={mockOnSubmit}
        sourceDescription={{
          type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
          link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
          year: 1850,
          isYearEstimated: false,
          noDate: false,
          references: [],
        }}
      />,
    );

    const linkButton = screen.getByRole("link", {
      name: /open score link in new tab/i,
    });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("aria-disabled", "false");
    expect(linkButton).not.toHaveClass("btn-disabled");
    expect(linkButton).toHaveAttribute(
      "href",
      "https://imslp.org/wiki/Special:ImagefromIndex/12345",
    );
    expect(linkButton).toHaveAttribute("target", "_blank");
    expect(linkButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("dynamically updates external link button state when user types a valid or invalid URL", () => {
    render(
      <SourceDescriptionEditForm
        onSubmit={mockOnSubmit}
        sourceDescription={{
          type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
          link: "",
          year: 1850,
          isYearEstimated: false,
          noDate: false,
          references: [],
        }}
      />,
    );

    const linkButton = screen.getByRole("link", {
      name: /open score link in new tab/i,
    });
    expect(linkButton).toHaveAttribute("aria-disabled", "true");

    const textboxes = screen.getAllByRole("textbox");
    const linkInput = textboxes.find(
      (el) => el.getAttribute("name") === "link",
    );
    expect(linkInput).toBeDefined();

    // Type an invalid URL
    fireEvent.change(linkInput!, { target: { value: "not-a-valid-url" } });
    expect(linkButton).toHaveAttribute("aria-disabled", "true");
    expect(linkButton).toHaveClass("btn-disabled");

    // Type a valid URL
    fireEvent.change(linkInput!, {
      target: { value: "https://example.com/score.pdf" },
    });
    expect(linkButton).toHaveAttribute("aria-disabled", "false");
    expect(linkButton).not.toHaveClass("btn-disabled");
    expect(linkButton).toHaveAttribute("href", "https://example.com/score.pdf");
  });
});

describe("SourceDescriptionEditForm - Review mode", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("leaves the link input editable when not in review mode", () => {
    render(
      <SourceDescriptionEditForm
        onSubmit={mockOnSubmit}
        isReviewMode={false}
        sourceDescription={{
          type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
          link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
          year: 1850,
          isYearEstimated: false,
          noDate: false,
          references: [],
        }}
      />,
    );

    const textboxes = screen.getAllByRole("textbox");
    const linkInput = textboxes.find(
      (el) => el.getAttribute("name") === "link",
    );
    expect(linkInput).toBeDefined();
    expect(linkInput).not.toBeDisabled();
  });

  it("disables the link input when isReviewMode prop is true, while keeping external link button active", () => {
    render(
      <SourceDescriptionEditForm
        onSubmit={mockOnSubmit}
        isReviewMode={true}
        sourceDescription={{
          type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
          link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
          year: 1850,
          isYearEstimated: false,
          noDate: false,
          references: [],
        }}
      />,
    );

    const textboxes = screen.getAllByRole("textbox");
    const linkInput = textboxes.find(
      (el) => el.getAttribute("name") === "link",
    );
    expect(linkInput).toBeDefined();
    expect(linkInput).toBeDisabled();

    const linkButton = screen.getByRole("link", {
      name: /open score link in new tab/i,
    });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("aria-disabled", "false");
    expect(linkButton).not.toHaveClass("btn-disabled");
    expect(linkButton).toHaveAttribute(
      "href",
      "https://imslp.org/wiki/Special:ImagefromIndex/12345",
    );
  });

  it("preserves the link value when submitting the form in review mode", async () => {
    let submittedData: any = null;
    mockOnSubmit.mockImplementation(async (data: any) => {
      submittedData = data;
      return undefined;
    });

    render(
      <SourceDescriptionEditForm
        onSubmit={mockOnSubmit}
        isReviewMode={true}
        sourceDescription={{
          type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
          link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
          year: 1850,
          isYearEstimated: false,
          noDate: false,
          references: [],
        }}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    expect(submittedData?.link).toBe(
      "https://imslp.org/wiki/Special:ImagefromIndex/12345",
    );
  });
});

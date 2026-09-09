import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
    return function MockMMSourceFormStepNavigation() {
      return <div data-testid="step-navigation" />;
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

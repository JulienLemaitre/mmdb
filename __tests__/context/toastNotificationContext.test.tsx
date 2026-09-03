import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  ToastNotificationProvider,
  useToastNotification,
} from "@/context/toastNotification/toastNotificationContext";
import { toastNotificationAction } from "@/context/toastNotification/toastNotificationAction";
import { STORAGE_INVALIDATED_EVENT } from "@/utils/localStorage";

// Helper component for testing useToastNotification hook
const TestNotifier = () => {
  const { notify } = useToastNotification();
  return (
    <button
      onClick={() =>
        notify(toastNotificationAction.SUCCESS, "Custom test success message")
      }
    >
      Trigger Toast
    </button>
  );
};

describe("ToastNotificationContext & Provider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("should display a WARNING toast in English when mmdb:storage-invalidated event is dispatched", () => {
    render(
      <ToastNotificationProvider>
        <div>App Content</div>
      </ToastNotificationProvider>,
    );

    expect(
      screen.queryByText(
        "Your previous local draft was reset due to an application update.",
      ),
    ).not.toBeInTheDocument();

    // Dispatch the storage-invalidated event
    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_INVALIDATED_EVENT, {
          detail: { key: "feedForm", reason: "incompatible_version" },
        }),
      );
    });

    expect(
      screen.getByText(
        "Your previous local draft was reset due to an application update.",
      ),
    ).toBeInTheDocument();
  });

  it("should allow manual notification dispatch through useToastNotification hook", () => {
    render(
      <ToastNotificationProvider>
        <TestNotifier />
      </ToastNotificationProvider>,
    );

    expect(
      screen.queryByText("Custom test success message"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trigger Toast" }));

    expect(
      screen.getByText("Custom test success message"),
    ).toBeInTheDocument();
  });
});

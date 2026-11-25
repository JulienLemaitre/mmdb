import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminDashboard from "@/features/admin/AdminDashboard";

describe("Admin tempo management tabs", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders Tempo Indications tab, supports sorting/filtering, and updates categories via modal", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("/api/admin/users")) {
        return {
          ok: true,
          json: async () => ({ items: [], nextCursor: null }),
        } as Response;
      }
      if (url === "/api/admin/tempo-categories") {
        return {
          ok: true,
          json: async () => ({
            items: [
              { id: "cat-1", name: "Adagio", rank: 1, tempoIndicationCount: 2 },
              { id: "cat-2", name: "Allegro", rank: 2, tempoIndicationCount: 0 },
            ],
          }),
        } as Response;
      }
      if (url.startsWith("/api/admin/tempo-indications/ti-1/categories")) {
        if (init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({
              categories: [
                { id: "cat-1", name: "Adagio" },
                { id: "cat-2", name: "Allegro" },
              ],
            }),
          } as Response;
        }
        if (init?.method === "DELETE") {
          return {
            ok: true,
            json: async () => ({
              categories: [{ id: "cat-2", name: "Allegro" }],
            }),
          } as Response;
        }
      }
      if (url.startsWith("/api/admin/tempo-indications")) {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                id: "ti-1",
                text: "Adagio cantabile",
                createdAt: "2026-01-15T10:00:00.000Z",
                author: { id: "u-1", name: "Jane Doe", email: "jane@example.com" },
                categories: [{ id: "cat-1", name: "Adagio" }],
              },
            ],
            nextCursor: null,
          }),
        } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("tab", { name: "Tempo Indications" }));

    expect(await screen.findByText("Adagio cantabile")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    // Toggle sort order by clicking Created header
    fireEvent.click(screen.getByRole("button", { name: /Sort by created date/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=asc"),
      );
    });

    // Filter by Uncategorized
    fireEvent.change(screen.getByLabelText("Filter by category"), {
      target: { value: "uncategorized" },
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("categoryFilter=uncategorized"),
      );
    });

    // Open Edit modal, add Allegro, then remove Adagio
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => {
      expect(screen.getAllByText("Allegro").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByRole("button", { name: "Remove" })[0]).toBeEnabled();
    });

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]);
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([u, opts]) =>
            String(u).includes("/api/admin/tempo-indications/ti-1/categories") &&
            (opts as RequestInit | undefined)?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("renders Tempo Categories tab, disables Delete when linked, and supports add/delete", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("/api/admin/users")) {
        return {
          ok: true,
          json: async () => ({ items: [], nextCursor: null }),
        } as Response;
      }
      if (url === "/api/admin/tempo-categories" && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            items: [
              { id: "cat-1", name: "Adagio", rank: 1, tempoIndicationCount: 5 },
              { id: "cat-2", name: "Unused", rank: 2, tempoIndicationCount: 0 },
            ],
          }),
        } as Response;
      }
      if (url === "/api/admin/tempo-categories" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            item: {
              id: "cat-3",
              name: "Scherzo",
              rank: 3,
              tempoIndicationCount: 0,
            },
          }),
        } as Response;
      }
      if (url === "/api/admin/tempo-categories/cat-2" && init?.method === "DELETE") {
        return {
          ok: true,
          json: async () => ({ deletedId: "cat-2" }),
        } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("tab", { name: "Tempo Categories" }));

    expect(await screen.findByText("Adagio")).toBeInTheDocument();
    expect(screen.getByText("Unused")).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).toBeEnabled();

    fireEvent.change(screen.getByPlaceholderText("e.g. Scherzo"), {
      target: { value: "Scherzo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByText("Scherzo")).toBeInTheDocument();

    fireEvent.click(deleteButtons[1]);
    await waitFor(() => {
      expect(screen.queryByText("Unused")).not.toBeInTheDocument();
    });
  });
});

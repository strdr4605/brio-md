// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import AttendancePage from "./page";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    groupSession: {
      get: { useQuery: () => ({ data: { id: 1, groupId: 1, date: "2026-06-08" } }) },
    },
    group: {
      get: { useQuery: () => ({ data: { id: 1, name: "Luni 17:30" } }) },
    },
    enrollment: {
      listByGroup: { useQuery: () => ({ data: [{ id: 1, studentId: 1, status: "active" }] }) },
    },
    student: {
      list: { useQuery: () => ({ data: [{ id: 1, name: "Ion Popescu" }] }) },
    },
    attendance: {
      listBySession: { useQuery: () => ({ data: [] }) },
      bulkSave: {
        useMutation: () => ({ mutate: vi.fn() }),
      },
    },
    useUtils: () => ({
      attendance: { listBySession: { invalidate: vi.fn() } },
    }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

describe("AttendancePage", () => {
  it("renders student name from enrollment", async () => {
    const qc = new QueryClient();
    await act(async () => {
      render(
        <QueryClientProvider client={qc}>
          <Suspense fallback={<div>loading</div>}>
            <AttendancePage params={Promise.resolve({ id: "1" })} />
          </Suspense>
        </QueryClientProvider>,
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Ion Popescu")).toBeTruthy();
    });
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Simple wrapper for isolated component tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
}

describe("QueryClient configuration", () => {
  it("renders children inside QueryClientProvider", () => {
    const { Wrapper } = createWrapper();
    render(
      <Wrapper>
        <div data-testid="child">Hello</div>
      </Wrapper>
    );
    expect(screen.getByTestId("child")).toBeTruthy();
  });
});

describe("Basic React rendering", () => {
  it("renders plain components without errors", () => {
    const Comp = () => <p>Test component renders</p>;
    render(<Comp />);
    expect(screen.getByText("Test component renders")).toBeTruthy();
  });

  it("renders conditional content correctly", () => {
    const Toggle = ({ show }: { show: boolean }) => (
      <div>{show ? <span>Visible</span> : <span>Hidden</span>}</div>
    );
    const { rerender } = render(<Toggle show={true} />);
    expect(screen.getByText("Visible")).toBeTruthy();
    rerender(<Toggle show={false} />);
    expect(screen.getByText("Hidden")).toBeTruthy();
  });

  it("renders a price in cents correctly as USD", () => {
    const Price = ({ cents }: { cents: number }) => (
      <span>${(cents / 100).toFixed(2)}</span>
    );
    render(<Price cents={1999} />);
    expect(screen.getByText("$19.99")).toBeTruthy();
  });

  it("renders free badge when price is 0", () => {
    const PackBadge = ({ isFree, priceCents }: { isFree: boolean; priceCents: number }) => (
      <span>{isFree || priceCents === 0 ? "Free" : `$${(priceCents / 100).toFixed(2)}`}</span>
    );
    render(<PackBadge isFree={true} priceCents={0} />);
    expect(screen.getByText("Free")).toBeTruthy();
  });

  it("renders pack count correctly", () => {
    const PackCount = ({ count }: { count: number }) => (
      <span>{count} {count === 1 ? "prompt" : "prompts"}</span>
    );
    render(<PackCount count={1} />);
    expect(screen.getByText("1 prompt")).toBeTruthy();

    const { rerender } = render(<PackCount count={5} />);
    expect(screen.getByText("5 prompts")).toBeTruthy();
  });
});

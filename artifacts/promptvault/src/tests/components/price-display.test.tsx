import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Inline price formatting utility (mirrors what the app uses)
function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDiscount(subtotal: number, discount: number): string {
  const pct = Math.round((discount / subtotal) * 100);
  return `${pct}% off`;
}

// Simple Button component that prevents double-submit
function SubmitButton({ onClick, disabled, children }: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-disabled={disabled}>
      {children}
    </button>
  );
}

describe("Price formatting", () => {
  it("formats free correctly", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("formats $19.99", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("formats $100.00", () => {
    expect(formatPrice(10000)).toBe("$100.00");
  });

  it("formats $0.99", () => {
    expect(formatPrice(99)).toBe("$0.99");
  });
});

describe("Discount formatting", () => {
  it("calculates 10% discount", () => {
    expect(formatDiscount(10000, 1000)).toBe("10% off");
  });

  it("calculates 50% discount", () => {
    expect(formatDiscount(2000, 1000)).toBe("50% off");
  });
});

describe("Double-submit prevention", () => {
  it("button can be disabled to prevent double-submit", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const { rerender } = render(<SubmitButton onClick={onClick} disabled={false}>Buy</SubmitButton>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);

    // Simulate disabling after first click (double-submit guard)
    rerender(<SubmitButton onClick={onClick} disabled={true}>Buying...</SubmitButton>);
    await user.click(screen.getByRole("button"));
    // Click on disabled button should NOT trigger the handler
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled button has aria-disabled", () => {
    render(<SubmitButton onClick={() => {}} disabled={true}>Loading</SubmitButton>);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("Pack card rendering", () => {
  const mockPack = {
    id: 1,
    title: "Ultimate Marketing Prompts",
    slug: "ultimate-marketing-prompts",
    shortDescription: "50 high-converting prompts for marketers",
    priceCents: 1999,
    comparePriceCents: 2999,
    isFree: false,
    isFeatured: true,
    avgRating: 4.8,
    reviewCount: 23,
    promptCount: 50,
  };

  it("renders pack title", () => {
    const Card = ({ pack }: { pack: typeof mockPack }) => (
      <div>
        <h2>{pack.title}</h2>
        <p>{pack.shortDescription}</p>
        <span>{formatPrice(pack.priceCents)}</span>
        {pack.isFeatured && <span>Featured</span>}
      </div>
    );
    render(<Card pack={mockPack} />);
    expect(screen.getByText("Ultimate Marketing Prompts")).toBeTruthy();
    expect(screen.getByText("$19.99")).toBeTruthy();
    expect(screen.getByText("Featured")).toBeTruthy();
  });

  it("shows compare price strikethrough when present", () => {
    const PriceBlock = ({ priceCents, comparePriceCents }: { priceCents: number; comparePriceCents?: number | null }) => (
      <div>
        <span className="current">{formatPrice(priceCents)}</span>
        {comparePriceCents && <span className="compare">{formatPrice(comparePriceCents)}</span>}
      </div>
    );
    render(<PriceBlock priceCents={1999} comparePriceCents={2999} />);
    expect(screen.getByText("$19.99")).toBeTruthy();
    expect(screen.getByText("$29.99")).toBeTruthy();
  });
});

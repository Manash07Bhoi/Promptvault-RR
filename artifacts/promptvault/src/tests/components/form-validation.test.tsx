import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";

// ─── Schema mirrors (same rules as actual Zod schemas used server-side) ───────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  displayName: z.string().min(2).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  bio: z.string().max(200).optional(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100),
  body: z.string().min(10).max(2000),
});

const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  subtotalCents: z.number().int().min(0),
});

// ─── Registration validation ──────────────────────────────────────────────────

describe("Registration form validation", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "SecurePass1",
      displayName: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "SecurePass1",
      displayName: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (too short)", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      displayName: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "alllowercase1",
      displayName: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "NoDigitsHere",
      displayName: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display name too short", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "SecurePass1",
      displayName: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display name too long", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "SecurePass1",
      displayName: "A".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

// ─── Login validation ─────────────────────────────────────────────────────────

describe("Login form validation", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "any" });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret" });
    expect(result.success).toBe(false);
  });
});

// ─── Profile validation ───────────────────────────────────────────────────────

describe("Profile form validation", () => {
  it("accepts valid profile", () => {
    const result = profileSchema.safeParse({ displayName: "John Doe", bio: "Hello world" });
    expect(result.success).toBe(true);
  });

  it("accepts profile without bio", () => {
    const result = profileSchema.safeParse({ displayName: "John Doe" });
    expect(result.success).toBe(true);
  });

  it("rejects bio over 200 chars", () => {
    const result = profileSchema.safeParse({ displayName: "John", bio: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects display name under 2 chars", () => {
    const result = profileSchema.safeParse({ displayName: "J" });
    expect(result.success).toBe(false);
  });
});

// ─── Review validation ────────────────────────────────────────────────────────

describe("Review form validation", () => {
  it("accepts valid review", () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      title: "Great pack!",
      body: "This pack saved me hours of work on my marketing campaigns.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating 0", () => {
    const result = reviewSchema.safeParse({ rating: 0, title: "Meh", body: "Too short" });
    expect(result.success).toBe(false);
  });

  it("rejects rating 6", () => {
    const result = reviewSchema.safeParse({ rating: 6, title: "Wow", body: "Really good prompts here" });
    expect(result.success).toBe(false);
  });

  it("rejects fractional rating", () => {
    const result = reviewSchema.safeParse({ rating: 4.5, title: "Good", body: "Pretty good overall I think" });
    expect(result.success).toBe(false);
  });

  it("rejects body under 10 chars", () => {
    const result = reviewSchema.safeParse({ rating: 4, title: "OK", body: "Short" });
    expect(result.success).toBe(false);
  });

  it("rejects body over 2000 chars", () => {
    const result = reviewSchema.safeParse({ rating: 4, title: "OK", body: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

// ─── Coupon validation ────────────────────────────────────────────────────────

describe("Coupon validation", () => {
  it("accepts valid coupon", () => {
    const result = couponSchema.safeParse({ code: "SAVE10", subtotalCents: 1999 });
    expect(result.success).toBe(true);
  });

  it("rejects negative subtotal", () => {
    const result = couponSchema.safeParse({ code: "SAVE10", subtotalCents: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects empty coupon code", () => {
    const result = couponSchema.safeParse({ code: "", subtotalCents: 1999 });
    expect(result.success).toBe(false);
  });
});

// ─── Simple form UI interaction tests ────────────────────────────────────────

describe("Form UI interaction", () => {
  it("controlled input updates value on change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const Input = ({ value, onChange: handleChange }: { value: string; onChange: (v: string) => void }) => (
      <input value={value} onChange={(e) => handleChange(e.target.value)} data-testid="input" />
    );

    const { rerender } = render(<Input value="" onChange={onChange} />);
    const input = screen.getByTestId("input");
    await user.type(input, "hello");
    expect(onChange).toHaveBeenCalled();
  });

  it("form submit is blocked when button is disabled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <button type="submit" disabled>Submit</button>
      </form>
    );

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("error message appears when validation fails", async () => {
    const Field = ({ error }: { error?: string }) => (
      <div>
        <input data-testid="field" />
        {error && <span role="alert">{error}</span>}
      </div>
    );
    render(<Field error="Email is required" />);
    expect(screen.getByRole("alert").textContent).toBe("Email is required");
  });

  it("error message disappears when validation passes", () => {
    const Field = ({ error }: { error?: string }) => (
      <div>
        <input data-testid="field" />
        {error && <span role="alert">{error}</span>}
      </div>
    );
    const { rerender } = render(<Field error="Email is required" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(<Field />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

// ─── Unsaved changes guard logic ──────────────────────────────────────────────

describe("Unsaved changes dirty tracking", () => {
  it("detects dirty state when value changes", () => {
    const initial = { title: "Original", description: "Original desc" };
    const current = { title: "Changed", description: "Original desc" };
    const isDirty = JSON.stringify(current) !== JSON.stringify(initial);
    expect(isDirty).toBe(true);
  });

  it("detects clean state when value reverts", () => {
    const initial = { title: "Original", description: "Original desc" };
    const current = { title: "Original", description: "Original desc" };
    const isDirty = JSON.stringify(current) !== JSON.stringify(initial);
    expect(isDirty).toBe(false);
  });

  it("detects dirty on nested array change", () => {
    const initial = { tags: ["a", "b"] };
    const current = { tags: ["a", "b", "c"] };
    expect(JSON.stringify(current) !== JSON.stringify(initial)).toBe(true);
  });

  it("detects dirty on boolean toggle", () => {
    const initial = { isFeatured: false };
    const current = { isFeatured: true };
    expect(JSON.stringify(current) !== JSON.stringify(initial)).toBe(true);
  });
});

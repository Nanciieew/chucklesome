import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.createClient }));
import { GET } from "./route";

const request = (query: Record<string, string> = {}) =>
  new NextRequest(`http://localhost:3001/auth/callback?${new URLSearchParams(query)}`);

function location(response: Response) {
  return new URL(response.headers.get("location")!);
}

beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: vi.fn(), eq: vi.fn(), single: mocks.single };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
  mocks.createClient.mockResolvedValue({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
      signOut: mocks.signOut,
    },
    from: mocks.from,
  });
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
  mocks.single.mockResolvedValue({ data: { is_superadmin: true }, error: null });
});

describe("Google sign-in callback", () => {
  it("reports Google exchange failures without exposing provider codes", async () => {
    const response = await GET(request({
      error: "server_error",
      error_code: "unexpected_failure",
      error_description: "Unable to exchange external code: sensitive-provider-code",
    }));
    const url = location(response);
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("error")).toContain("Google client ID and client secret");
    expect(url.href).not.toContain("sensitive-provider-code");
    expect(url.href).not.toContain("No%20code%20provided");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    [{ error: "access_denied" }, "cancelled or access was denied"],
    [{ error_description: "Database error saving new user" }, "could not create your account"],
    [{ error: "server_error", error_description: "sensitive unexpected details" }, "Google sign-in failed"],
  ])("handles provider errors before trying to exchange a code", async (query, expected) => {
    const url = location(await GET(request({ ...query, code: "unused-code" })));
    expect(url.searchParams.get("error")).toContain(expected);
    expect(url.href).not.toContain("sensitive");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("asks for a fresh sign-in when the callback has no code or error", async () => {
    const url = location(await GET(request()));
    expect(url.searchParams.get("error")).toContain("sign-in link is incomplete");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("stops when the app's code exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });
    const url = location(await GET(request({ code: "expired-code" })));
    expect(url.searchParams.get("error")).toContain("could not be verified or has expired");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("opens the admin overview after verifying a superadmin", async () => {
    const url = location(await GET(request({ code: "valid-code", redirect_to: "https://elsewhere.invalid" })));
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(url.href).toBe("http://localhost:3001/overview");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it.each([null, { is_superadmin: false }])("denies admin access for an unprivileged profile", async (profile) => {
    mocks.single.mockResolvedValue({ data: profile, error: null });
    const url = location(await GET(request({ code: "valid-code" })));
    expect(url.searchParams.get("error")).toContain("Superadmin privileges required");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("handles a thrown exchange error without exposing internal details", async () => {
    mocks.exchangeCodeForSession.mockRejectedValue(new Error("sensitive details"));
    const url = location(await GET(request({ code: "valid-code" })));
    expect(url.searchParams.get("error")).toContain("unexpected error");
    expect(url.href).not.toContain("sensitive");
  });
});

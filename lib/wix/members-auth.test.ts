import { describe, expect, it, vi } from "vitest";
import { mapAuthError, MemberAuthError } from "./members-auth";

describe("mapAuthError", () => {
  it("maps a 409 conflict to emailAlreadyExists", () => {
    const err = mapAuthError({ status: 409 });
    expect(err).toBeInstanceOf(MemberAuthError);
    expect((err as MemberAuthError).code).toBe("emailAlreadyExists");
  });

  it("maps applicationError code -19995 to emailAlreadyExists", () => {
    const err = mapAuthError({ body: { details: { applicationError: { code: "-19995" } } } });
    expect((err as MemberAuthError).code).toBe("emailAlreadyExists");
  });

  it("maps a 401 to invalidCredentials", () => {
    const err = mapAuthError({ status: 401 });
    expect((err as MemberAuthError).code).toBe("invalidCredentials");
  });

  it("maps a 404 to invalidCredentials", () => {
    const err = mapAuthError({ status: 404 });
    expect((err as MemberAuthError).code).toBe("invalidCredentials");
  });

  it("maps applicationError code -19976 (wrong password) to invalidCredentials", () => {
    const err = mapAuthError({ body: { details: { applicationError: { code: "-19976" } } } });
    expect((err as MemberAuthError).code).toBe("invalidCredentials");
  });

  it("passes through an existing MemberAuthError unchanged", () => {
    const original = new MemberAuthError("timeout", "Login timed out.");
    expect(mapAuthError(original)).toBe(original);
  });

  it("bubbles an unmapped error as-is (fail loudly)", () => {
    const original = new Error("network down");
    expect(mapAuthError(original)).toBe(original);
  });

  it("logs the real code for an unmapped Wix applicationError (e.g. SITE_NOT_PUBLISHED_EXCEPTION) but still bubbles it as-is", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const original = {
      status: 400,
      body: { message: "site is not published", details: { applicationError: { code: "SITE_NOT_PUBLISHED_EXCEPTION" } } },
    };
    expect(mapAuthError(original)).toBe(original);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("status 400"), "SITE_NOT_PUBLISHED_EXCEPTION");
    spy.mockRestore();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startWhatsAppEmbeddedSignup } from "./embedded-signup";

function postMetaMessage(payload: unknown, origin = "https://www.facebook.com") {
  window.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(payload), origin }));
}

/** jsdom never executes the injected `<script src="...facebook.net...">` tag, so this
 * simulates what the real SDK does once it loads: call `fbAsyncInit`, which the module
 * under test wires up to call `FB.init` and unblock the returned promise. */
function completeSdkLoad() {
  window.fbAsyncInit?.();
}

describe("startWhatsAppEmbeddedSignup", () => {
  let login: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    login = vi.fn();
    window.FB = { init: vi.fn(), login } as Window["FB"];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.FB;
    delete window.fbAsyncInit;
  });

  it("resolves once both the login code and the postMessage ids have arrived", async () => {
    login.mockImplementation((callback) => {
      callback({ status: "connected", authResponse: { code: "auth-code" } });
    });

    const resultPromise = startWhatsAppEmbeddedSignup("app-id", "config-id");
    completeSdkLoad();
    await Promise.resolve();
    postMetaMessage({
      type: "WA_EMBEDDED_SIGNUP",
      event: "FINISH",
      data: { waba_id: "waba1", phone_number_id: "phone1" },
    });

    await expect(resultPromise).resolves.toEqual({ code: "auth-code", wabaId: "waba1", phoneNumberId: "phone1" });
  });

  it("resolves when the postMessage arrives before the login callback", async () => {
    let capturedCallback: ((response: { status: string; authResponse?: { code?: string } }) => void) | undefined;
    login.mockImplementation((callback) => {
      capturedCallback = callback;
    });

    const resultPromise = startWhatsAppEmbeddedSignup("app-id", "config-id");
    completeSdkLoad();
    await Promise.resolve();
    postMetaMessage({
      type: "WA_EMBEDDED_SIGNUP",
      event: "FINISH",
      data: { waba_id: "waba1", phone_number_id: "phone1" },
    });
    capturedCallback?.({ status: "connected", authResponse: { code: "auth-code" } });

    await expect(resultPromise).resolves.toEqual({ code: "auth-code", wabaId: "waba1", phoneNumberId: "phone1" });
  });

  it("rejects when the signup popup is canceled", async () => {
    const resultPromise = startWhatsAppEmbeddedSignup("app-id", "config-id");
    completeSdkLoad();
    await Promise.resolve();
    postMetaMessage({ type: "WA_EMBEDDED_SIGNUP", event: "CANCEL" });

    await expect(resultPromise).rejects.toThrow("Cancelaste la conexión");
  });

  it("rejects when the login window closes without a code", async () => {
    login.mockImplementation((callback) => {
      callback({ status: "not_authorized" });
    });

    const resultPromise = startWhatsAppEmbeddedSignup("app-id", "config-id");
    completeSdkLoad();

    await expect(resultPromise).rejects.toThrow("se cerró sin completar");
  });

  it("ignores messages from origins other than Meta's", async () => {
    login.mockImplementation((callback) => {
      callback({ status: "connected", authResponse: { code: "auth-code" } });
    });

    const resultPromise = startWhatsAppEmbeddedSignup("app-id", "config-id");
    completeSdkLoad();
    await Promise.resolve();
    postMetaMessage(
      { type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { waba_id: "spoofed", phone_number_id: "spoofed" } },
      "https://evil.example",
    );
    postMetaMessage({
      type: "WA_EMBEDDED_SIGNUP",
      event: "FINISH",
      data: { waba_id: "waba1", phone_number_id: "phone1" },
    });

    await expect(resultPromise).resolves.toEqual({ code: "auth-code", wabaId: "waba1", phoneNumberId: "phone1" });
  });
});

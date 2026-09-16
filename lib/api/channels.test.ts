import { afterEach, describe, expect, it, vi } from "vitest";
import {
  connectWhatsApp,
  disconnectChannel,
  listChannels,
  verifyChannel,
  type ChannelAccount,
} from "./channels";
import { resetRefreshLock } from "./client";

const tenantId = "11111111-1111-4111-8111-111111111111";

const account: ChannelAccount = {
  id: "c1",
  kind: "WhatsApp",
  externalId: "1234567890",
  displayName: "Panadería La Espiga",
  phoneE164: "+1234567890",
  status: "Connected",
  connectedAt: "2026-09-01T12:00:00+00:00",
  tokenExpiresAt: null,
  expiresSoon: false,
};

function stubJson(body: unknown, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as [string, RequestInit];
}

describe("channels api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("lists connected channels", async () => {
    const fetchMock = stubJson([account]);

    await expect(listChannels(tenantId)).resolves.toEqual([account]);
    expect(lastCall(fetchMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/channels`);
  });

  it("connects a whatsapp account from the embedded signup callback", async () => {
    const fetchMock = stubJson(account, 201);

    await connectWhatsApp(tenantId, { code: "auth-code", wabaId: "waba1", phoneNumberId: "phone1" });

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/channels/whatsapp`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      code: "auth-code",
      wabaId: "waba1",
      phoneNumberId: "phone1",
    });
  });

  it("retries verification for a pending channel", async () => {
    const fetchMock = stubJson({ ...account, status: "Connected" });

    await verifyChannel(tenantId, "c1");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/channels/c1/verify`);
    expect(init.method).toBe("POST");
  });

  it("disconnects a channel", async () => {
    const fetchMock = stubJson(null, 204);

    await disconnectChannel(tenantId, "c1");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/channels/c1`);
    expect(init.method).toBe("DELETE");
  });
});

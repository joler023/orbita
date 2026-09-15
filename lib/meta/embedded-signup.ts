/**
 * Meta's WhatsApp Embedded Signup (Facebook JS SDK), per ORB-B01. Untested against a
 * real Meta app — there isn't one yet (see CLAUDE.md's Channels section and
 * NEXT_PUBLIC_META_APP_ID in .env.example). Shaped to match Meta's documented flow so
 * that connecting a real app tomorrow is a config change, not a rewrite:
 *
 * 1. Load the Facebook JS SDK and `FB.init` with the app id.
 * 2. `FB.login` with the WhatsApp Signup `config_id`, requesting an auth `code`.
 * 3. In parallel, Meta's signup popup posts a `window.postMessage` with the
 *    `waba_id`/`phone_number_id` the person actually picked — `FB.login`'s own
 *    callback only ever returns the `code`, never those two ids.
 * 4. Both are needed before `POST /api/tenants/{tenantId}/channels/whatsapp` can be
 *    called (see lib/api/channels.ts) — the whole promise here resolves only once both
 *    arrived, whichever order they happen to fire in.
 */

const SDK_VERSION = "v21.0";
const META_MESSAGE_ORIGINS = new Set(["https://www.facebook.com", "https://web.facebook.com"]);

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

type FacebookSdk = {
  init: (params: { appId: string; version: string; xfbml: boolean }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: {
      config_id: string;
      response_type: "code";
      override_default_response_type: true;
      extras?: Record<string, unknown>;
    },
  ) => void;
};

type FacebookLoginResponse = {
  status: string;
  authResponse?: { code?: string };
};

type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  data?: { waba_id?: string; phone_number_id?: string };
};

export type EmbeddedSignupResult = {
  code: string;
  wabaId: string;
  phoneNumberId: string;
};

let sdkLoadPromise: Promise<void> | null = null;

function loadFacebookSdk(appId: string): Promise<void> {
  sdkLoadPromise ??= new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, version: SDK_VERSION, xfbml: false });
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

export function startWhatsAppEmbeddedSignup(
  appId: string,
  configId: string,
): Promise<EmbeddedSignupResult> {
  return loadFacebookSdk(appId).then(
    () =>
      new Promise<EmbeddedSignupResult>((resolve, reject) => {
        let wabaId: string | undefined;
        let phoneNumberId: string | undefined;
        let code: string | undefined;
        let settled = false;

        const finishIfReady = () => {
          if (settled || !code || !wabaId || !phoneNumberId) {
            return;
          }
          settled = true;
          window.removeEventListener("message", onMessage);
          resolve({ code, wabaId, phoneNumberId });
        };

        const onMessage = (event: MessageEvent) => {
          if (!META_MESSAGE_ORIGINS.has(event.origin)) {
            return;
          }
          let parsed: EmbeddedSignupMessage;
          try {
            parsed = JSON.parse(event.data as string) as EmbeddedSignupMessage;
          } catch {
            return;
          }
          if (parsed.type === "WA_EMBEDDED_SIGNUP" && parsed.event === "FINISH" && parsed.data) {
            wabaId = parsed.data.waba_id;
            phoneNumberId = parsed.data.phone_number_id;
            finishIfReady();
          } else if (parsed.type === "WA_EMBEDDED_SIGNUP" && parsed.event === "CANCEL") {
            settled = true;
            window.removeEventListener("message", onMessage);
            reject(new Error("Cancelaste la conexión antes de terminar."));
          }
        };
        window.addEventListener("message", onMessage);

        if (!window.FB) {
          reject(new Error("No pudimos cargar el SDK de Meta. Revisa tu conexión e inténtalo de nuevo."));
          return;
        }

        window.FB.login(
          (response) => {
            if (response.status !== "connected" || !response.authResponse?.code) {
              settled = true;
              window.removeEventListener("message", onMessage);
              reject(new Error("La ventana de Meta se cerró sin completar la conexión."));
              return;
            }
            code = response.authResponse.code;
            finishIfReady();
          },
          {
            config_id: configId,
            response_type: "code",
            override_default_response_type: true,
            extras: { setup: {}, featureType: "" },
          },
        );
      }),
  );
}

import { Porto, Dialog, Mode } from "porto";
import * as Chains from "porto/core/Chains";
import type { ThemeFragment } from "porto/theme";

function getPortoChains():
  | readonly [typeof Chains.base]
  | readonly [typeof Chains.baseSepolia] {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId === "84532") {
    return [Chains.baseSepolia] as const;
  }
  return [Chains.base] as const;
}

export const villaTheme: ThemeFragment = {
  colorScheme: "light",
  accent: "#ffe047",
  primaryBackground: "#ffe047",
  primaryContent: "#382207",
  primaryBorder: "#ffe047",
  primaryHoveredBackground: "#f5d63d",
  primaryHoveredBorder: "#f5d63d",
  secondaryBackground: "#fef9f0",
  secondaryContent: "#0d0d17",
  secondaryBorder: "#e0e0e6",
  secondaryHoveredBackground: "#fdf3e0",
  secondaryHoveredBorder: "#c4c4cc",
  baseBackground: "#fffcf8",
  baseAltBackground: "#fef9f0",
  basePlaneBackground: "#fdf3e0",
  baseContent: "#0d0d17",
  baseContentSecondary: "#45454f",
  baseContentTertiary: "#61616b",
  baseBorder: "#e0e0e6",
  baseHoveredBackground: "#fef9f0",
  frameBackground: "#fffcf8",
  frameBorder: "#e0e0e6",
  frameContent: "#0d0d17",
  frameRadius: 14,
  fieldBackground: "#fffcf8",
  fieldContent: "#0d0d17",
  fieldContentSecondary: "#45454f",
  fieldBorder: "#e0e0e6",
  fieldFocusedBackground: "#fffcf8",
  fieldFocusedContent: "#0d0d17",
  fieldErrorBorder: "#ef4444",
  radiusSmall: 6,
  radiusMedium: 10,
  radiusLarge: 14,
  positiveBackground: "#e8f5e8",
  positiveContent: "#698f69",
  positiveBorder: "#698f69",
  negativeBackground: "#fee2e2",
  negativeContent: "#dc2626",
  negativeBorder: "#fca5a5",
  focus: "#ffe047",
  link: "#382207",
  separator: "#e0e0e6",
};

let portoInstance: ReturnType<typeof Porto.create> | null = null;
let themeController: Dialog.ThemeController | null = null;

export function getPorto(): ReturnType<typeof Porto.create> {
  if (!portoInstance) {
    themeController = Dialog.createThemeController();

    portoInstance = Porto.create({
      chains: getPortoChains(),
      mode: Mode.dialog({
        renderer: Dialog.iframe(),
        host: "https://id.porto.sh/dialog",
        theme: villaTheme,
        themeController,
      }),
    });
  }
  return portoInstance;
}

export function resetPorto(): void {
  portoInstance = null;
  themeController = null;
}

export interface ConnectResult {
  success: true;
  address: string;
}

export interface ConnectError {
  success: false;
  error: Error;
}

export type PortoConnectResult = ConnectResult | ConnectError;

export async function createAccount(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto();

    const result = await porto.provider.request({
      method: "wallet_connect",
      params: [
        {
          capabilities: {
            createAccount: true,
            email: false,
          },
        },
      ],
    });

    const response = result as unknown as {
      accounts: readonly { address: string }[];
    };

    if (response.accounts && response.accounts.length > 0) {
      return {
        success: true,
        address: response.accounts[0].address,
      };
    }

    return {
      success: false,
      error: new Error("No account returned from Porto"),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

export async function signIn(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto();

    const accounts = await porto.provider.request({
      method: "eth_requestAccounts",
    });

    if (accounts && accounts.length > 0) {
      return {
        success: true,
        address: accounts[0],
      };
    }

    return {
      success: false,
      error: new Error("No account selected"),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

export function isPortoSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

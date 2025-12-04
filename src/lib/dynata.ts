/**
 * Dynata Panel Integration Utilities
 *
 * Handles building redirect URLs and parameter parsing for Dynata panel integration.
 * See docs/DYNATA_INTEGRATION_PLAN.md for full documentation.
 */

/**
 * Dynata RST (Response Status) values
 */
export const DYNATA_RST = {
  COMPLETE: "1", // Survey completed successfully
  SCREENOUT: "2", // Terminated/screened out (demographics don't match)
  QUOTA_FULL: "3", // Over quota
} as const;

export type DynataStatus = "complete" | "screenout" | "quota_full";

/**
 * Build a Dynata-compatible redirect URL
 *
 * @param returnUrl - The base return URL (from Dynata or configured)
 * @param psid - The participant session ID
 * @param status - The completion status
 * @param basicCode - Optional project-specific basic code from Dynata
 * @returns The full redirect URL with rst, psid, and optionally basic parameters
 */
export const buildDynataRedirect = (
  returnUrl: string,
  psid: string | null,
  status: DynataStatus,
  basicCode?: string | null
) => {
  const rstMap: Record<DynataStatus, string> = {
    complete: DYNATA_RST.COMPLETE,
    screenout: DYNATA_RST.SCREENOUT,
    quota_full: DYNATA_RST.QUOTA_FULL,
  };

  try {
    const url = new URL(returnUrl);
    url.searchParams.set("rst", rstMap[status]);
    if (psid) {
      url.searchParams.set("psid", psid);
    }
    if (basicCode) {
      url.searchParams.set("basic", basicCode);
    }
    return url.toString();
  } catch {
    // If URL parsing fails, append parameters manually
    const separator = returnUrl.includes("?") ? "&" : "?";
    const psidParam = psid ? `&psid=${encodeURIComponent(psid)}` : "";
    const basicParam = basicCode ? `&basic=${encodeURIComponent(basicCode)}` : "";
    return `${returnUrl}${separator}rst=${rstMap[status]}${psidParam}${basicParam}`;
  }
};

/**
 * Build a Dynata redirect using form-level settings
 * Falls back to session-level returnUrl if form settings not configured
 */
export const buildDynataRedirectFromForm = (
  form: { dynataEnabled?: boolean; dynataReturnUrl?: string | null; dynataBasicCode?: string | null },
  session: { returnUrl?: string | null; externalPid?: string | null },
  status: DynataStatus
) => {
  // Use form-level settings if Dynata is enabled and configured
  if (form.dynataEnabled && form.dynataReturnUrl) {
    return buildDynataRedirect(
      form.dynataReturnUrl,
      session.externalPid ?? null,
      status,
      form.dynataBasicCode
    );
  }

  // Fall back to session-level returnUrl (passed via URL params)
  if (session.returnUrl) {
    return buildDynataRedirect(session.returnUrl, session.externalPid ?? null, status);
  }

  return null;
};

/**
 * Parse Dynata parameters from URL search params
 *
 * Supports multiple parameter names for backwards compatibility:
 * - psid, PSID (preferred)
 * - pid, PID (legacy)
 *
 * @param urlParams - URLSearchParams object
 * @returns Object with externalPid and returnUrl
 */
export const parseDynataParams = (urlParams: URLSearchParams): {
  externalPid: string | null;
  returnUrl: string | null;
} => {
  // Try psid first (Dynata standard), then fall back to pid (legacy)
  const externalPid =
    urlParams.get("psid") ||
    urlParams.get("PSID") ||
    urlParams.get("pid") ||
    urlParams.get("PID");

  const returnUrl =
    urlParams.get("return_url") ||
    urlParams.get("returnUrl") ||
    urlParams.get("return") ||
    urlParams.get("redirect");

  return { externalPid, returnUrl };
};

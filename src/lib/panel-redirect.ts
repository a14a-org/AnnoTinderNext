/**
 * Unified Panel Redirect Dispatcher
 *
 * Routes redirect URL building to the correct panel-specific module
 * based on the session's panelSource field.
 */

import { buildDynataRedirect } from "./dynata";
import { buildMotivactionRedirect } from "./motivaction";

export type PanelStatus = "complete" | "screenout" | "quota_full";

interface PanelFormConfig {
  dynataEnabled?: boolean;
  dynataReturnUrl?: string | null;
  dynataBasicCode?: string | null;
  motivactionEnabled?: boolean;
  motivactionReturnUrl?: string | null;
}

interface PanelSessionConfig {
  panelSource?: string | null;
  externalPid?: string | null;
  externalParam2?: string | null;
  returnUrl?: string | null;
}

/**
 * Build the correct panel redirect URL based on session panelSource.
 * Returns null if no panel redirect is applicable.
 */
export const buildPanelRedirectFromForm = (
  form: PanelFormConfig,
  session: PanelSessionConfig,
  status: PanelStatus
): string | null => {
  // Motivaction: session explicitly from Motivaction panel
  if (
    session.panelSource === "motivaction" &&
    form.motivactionEnabled &&
    form.motivactionReturnUrl
  ) {
    return buildMotivactionRedirect(
      form.motivactionReturnUrl,
      session.externalPid ?? null,
      session.externalParam2 ?? null,
      status
    );
  }

  // Dynata: session explicitly from Dynata panel
  if (
    session.panelSource === "dynata" &&
    form.dynataEnabled &&
    form.dynataReturnUrl
  ) {
    return buildDynataRedirect(
      form.dynataReturnUrl,
      session.externalPid ?? null,
      status,
      form.dynataBasicCode
    );
  }

  // Backward compatibility: existing sessions without panelSource (assumed Dynata)
  if (form.dynataEnabled && form.dynataReturnUrl) {
    return buildDynataRedirect(
      form.dynataReturnUrl,
      session.externalPid ?? null,
      status,
      form.dynataBasicCode
    );
  }

  // Legacy fallback: session-level returnUrl
  if (session.returnUrl) {
    return buildDynataRedirect(
      session.returnUrl,
      session.externalPid ?? null,
      status
    );
  }

  return null;
};

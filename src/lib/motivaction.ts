/**
 * Motivaction (StemPunt) Panel Integration Utilities
 *
 * Entry URL params: ?d={xx}&k={yy}
 * Return URL: https://www.stempunt.nu/s.asp?d=xx&k=yy&extid={01|02|03}&q=return
 */

export const MOTIVACTION_EXTID = {
  COMPLETE: "01",
  SCREENOUT: "02",
  QUOTA_FULL: "03",
} as const;

export type MotivactionStatus = "complete" | "screenout" | "quota_full";

/**
 * Build a Motivaction-compatible redirect URL
 *
 * @param returnUrl - The base return URL (e.g. https://www.stempunt.nu/s.asp)
 * @param dValue - The d parameter from the incoming URL
 * @param kValue - The k parameter from the incoming URL
 * @param status - The completion status
 * @returns The full redirect URL with d, k, extid, and q=return parameters
 */
export const buildMotivactionRedirect = (
  returnUrl: string,
  dValue: string | null,
  kValue: string | null,
  status: MotivactionStatus
): string => {
  const extidMap: Record<MotivactionStatus, string> = {
    complete: MOTIVACTION_EXTID.COMPLETE,
    screenout: MOTIVACTION_EXTID.SCREENOUT,
    quota_full: MOTIVACTION_EXTID.QUOTA_FULL,
  };

  try {
    const url = new URL(returnUrl);
    if (dValue) url.searchParams.set("d", dValue);
    if (kValue) url.searchParams.set("k", kValue);
    url.searchParams.set("extid", extidMap[status]);
    url.searchParams.set("q", "return");
    return url.toString();
  } catch {
    const separator = returnUrl.includes("?") ? "&" : "?";
    const dParam = dValue ? `d=${encodeURIComponent(dValue)}` : "";
    const kParam = kValue ? `&k=${encodeURIComponent(kValue)}` : "";
    return `${returnUrl}${separator}${dParam}${kParam}&extid=${extidMap[status]}&q=return`;
  }
};

/**
 * Parse Motivaction parameters from URL search params
 *
 * @param urlParams - URLSearchParams object
 * @returns Object with dValue and kValue
 */
export const parseMotivactionParams = (
  urlParams: URLSearchParams
): {
  dValue: string | null;
  kValue: string | null;
} => ({
  dValue: urlParams.get("d"),
  kValue: urlParams.get("k"),
});

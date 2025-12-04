"use client";

import { useMemo } from "react";

interface UseUrlParamsResult {
  externalPid: string | null;
  returnUrl: string | null;
}

const getUrlParams = () => {
  if (typeof window === "undefined") {
    return { externalPid: null, returnUrl: null };
  }

  const urlParams = new URLSearchParams(window.location.search);

  // Support both psid (Dynata standard) and pid (legacy)
  const externalPid =
    urlParams.get("psid") ||
    urlParams.get("PSID") ||
    urlParams.get("pid") ||
    urlParams.get("PID") ||
    null;

  const returnUrl =
    urlParams.get("return_url") ||
    urlParams.get("returnUrl") ||
    urlParams.get("return") ||
    urlParams.get("redirect") ||
    null;

  return { externalPid, returnUrl };
};

export const useUrlParams = (): UseUrlParamsResult => {
   
  return useMemo(() => getUrlParams(), []);
};

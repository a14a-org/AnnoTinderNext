"use client";

import { useMemo } from "react";

interface UseUrlParamsResult {
  panelSource: "dynata" | "motivaction" | null;
  externalPid: string | null;
  externalParam2: string | null;
  returnUrl: string | null;
}

const getUrlParams = (): UseUrlParamsResult => {
  if (typeof window === "undefined") {
    return { panelSource: null, externalPid: null, externalParam2: null, returnUrl: null };
  }

  const urlParams = new URLSearchParams(window.location.search);

  // Check for Motivaction first (d + k params)
  const dValue = urlParams.get("d");
  const kValue = urlParams.get("k");
  if (dValue && kValue) {
    return {
      panelSource: "motivaction",
      externalPid: dValue,
      externalParam2: kValue,
      returnUrl: null,
    };
  }

  // Check for Dynata (psid/pid params)
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

  if (externalPid) {
    return {
      panelSource: "dynata",
      externalPid,
      externalParam2: null,
      returnUrl,
    };
  }

  return { panelSource: null, externalPid: null, externalParam2: null, returnUrl: null };
};

export const useUrlParams = (): UseUrlParamsResult => {

  return useMemo(() => getUrlParams(), []);
};

import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext.tsx";
import { Config } from "../providers/ConfigProvider.tsx";

export function useConfig(): Config {
  return useContext(ConfigContext);
}
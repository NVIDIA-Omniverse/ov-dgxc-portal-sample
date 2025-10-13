import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext";
import { Config } from "../providers/ConfigProvider";

export function useConfig(): Config {
  return useContext(ConfigContext);
}
import { createContext } from "react";
import { Config } from "../providers/ConfigProvider";

export const ConfigContext = createContext<Config>({} as unknown as Config);
import { Loader } from "@mantine/core";

export function StreamLoader() {
  return (
    <Loader
      m={"sm"}
      style={{ position: "absolute", top: "0.5rem", right: "1rem" }}
    />
  );
}

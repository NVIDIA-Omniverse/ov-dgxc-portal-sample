import { NavLink as MantineNavLink, Stack, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import classes from "./ApplicationPages.module.css";

export interface ApplicationPagesProps {
  pages: string[];
  selectedPage?: string;
}

export default function ApplicationPages({
  pages,
  selectedPage,
}: ApplicationPagesProps) {
  return (
    <Stack className={classes.applicationPages} gap={0}>
      <Title className={classes.applicationPagesTitle} order={2}>
        Pages
      </Title>

      {pages.map((page, index) => (
        <MantineNavLink
          key={page}
          component={Link}
          active={selectedPage ? selectedPage === page : index === 0}
          className={classes.applicationPage}
          color={"gray"}
          label={page}
          to={{ search: `?page=${page}` }}
          title={page}
        />
      ))}
    </Stack>
  );
}

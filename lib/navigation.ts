import type { ComponentType } from "react";

import {
  GraphIcon,
  HomeIcon,
  InboxIcon,
  LibraryIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
  type IconProps,
} from "@/components/icons";

export interface NavigationItem {
  href: "/home" | "/inbox" | "/library" | "/notes" | "/graph" | "/search" | "/capture";
  labelKey: "nav.home" | "nav.inbox" | "nav.library" | "nav.notes" | "nav.graph" | "nav.search" | "nav.capture";
  descriptionKey: "nav.home" | "nav.inbox" | "nav.library" | "nav.notes" | "nav.graph" | "nav.search" | "nav.capture";
  icon: ComponentType<IconProps>;
}

export const navigationItems: NavigationItem[] = [
  { href: "/home", labelKey: "nav.home", descriptionKey: "nav.home", icon: HomeIcon },
  { href: "/inbox", labelKey: "nav.inbox", descriptionKey: "nav.inbox", icon: InboxIcon },
  { href: "/library", labelKey: "nav.library", descriptionKey: "nav.library", icon: LibraryIcon },
  { href: "/notes", labelKey: "nav.notes", descriptionKey: "nav.notes", icon: NoteIcon },
  { href: "/graph", labelKey: "nav.graph", descriptionKey: "nav.graph", icon: GraphIcon },
  { href: "/search", labelKey: "nav.search", descriptionKey: "nav.search", icon: SearchIcon },
];

export const tabletNavigationItems = navigationItems.filter((item) =>
  ["/home", "/inbox", "/search", "/graph"].includes(item.href),
);

export const tabletCaptureItem: NavigationItem = {
  href: "/capture",
  labelKey: "nav.capture",
  descriptionKey: "nav.capture",
  icon: PlusIcon,
};

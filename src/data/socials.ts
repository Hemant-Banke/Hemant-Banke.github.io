// Social / contact links. `label` is shown as ASCII text;
import { site } from "./site";

export interface Social {
  key: string;
  label: string;
  href: string;
  handle: string;
}

export const socials: Social[] = [
  { key: "github", label: "github", href: "https://github.com/Hemant-Banke", handle: "@Hemant-Banke" },
  { key: "x", label: "x/twitter", href: "https://x.com/hemant2513", handle: "@hemant2513" },
  {
    key: "linkedin",
    label: "linkedin",
    href: "https://www.linkedin.com/in/hemant-banke/",
    handle: "in/hemant-banke",
  },
  // {
  //   key: "scholar",
  //   label: "scholar",
  //   href: "https://scholar.google.com/",
  //   handle: "citations",
  // },
  { key: "mail", label: "email", href: `mailto:${site.email}`, handle: site.email },
];

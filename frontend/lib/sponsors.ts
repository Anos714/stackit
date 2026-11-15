export const SPONSOR_MAILTO =
  "mailto:sainrahul374@gmail.com?subject=Sponsoring%20stackit&body=Hey%20Rahul%2C%0A%0AI%27d%20like%20to%20sponsor%20stackit.%20Here%27s%20what%20I%20had%20in%20mind%3A%0A%0A";

export const SPONSOR_SLOT_COUNT = 6;

export type Sponsor = {
  name: string;
  note: string;
  href: string;
};

export const SPONSORS: Sponsor[] = [
  {
    name: "Kilosmith",
    note: "Heavy files, made light.",
    href: "https://kilosmith.vercel.app/",
  },
];

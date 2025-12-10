import { KEY } from "@/prisma/client/enums";

export default function getKeyLabel(key: KEY) {
  switch (key) {
    case KEY.A_FLAT_MAJOR:
      return "A-flat Major";
    case KEY.A_FLAT_MINOR:
      return "A-flat Minor";
    case KEY.A_MAJOR:
      return "A Major";
    case KEY.A_MINOR:
      return "A Minor";
    case KEY.A_SHARP_MAJOR:
      return "A-sharp Major";
    case KEY.A_SHARP_MINOR:
      return "A-sharp Minor";
    case KEY.B_FLAT_MAJOR:
      return "B-flat Major";
    case KEY.B_FLAT_MINOR:
      return "B-flat Minor";
    case KEY.B_MAJOR:
      return "B Major";
    case KEY.B_MINOR:
      return "B Minor";
    case KEY.C_FLAT_MAJOR:
      return "C-flat Major";
    case KEY.C_FLAT_MINOR:
      return "C-flat Minor";
    case KEY.C_MAJOR:
      return "C Major";
    case KEY.C_MINOR:
      return "C Minor";
    case KEY.C_SHARP_MAJOR:
      return "C-sharp Major";
    case KEY.C_SHARP_MINOR:
      return "C-sharp Minor";
    case KEY.D_FLAT_MAJOR:
      return "D-flat Major";
    case KEY.D_FLAT_MINOR:
      return "D-flat Minor";
    case KEY.D_MAJOR:
      return "D Major";
    case KEY.D_MINOR:
      return "D Minor";
    case KEY.D_SHARP_MAJOR:
      return "D-sharp Major";
    case KEY.D_SHARP_MINOR:
      return "D-sharp Minor";
    case KEY.E_FLAT_MAJOR:
      return "E-flat Major";
    case KEY.E_FLAT_MINOR:
      return "E-flat Minor";
    case KEY.E_MAJOR:
      return "E Major";
    case KEY.E_MINOR:
      return "E Minor";
    case KEY.F_FLAT_MAJOR:
      return "F-flat Major";
    case KEY.F_FLAT_MINOR:
      return "F-flat Minor";
    case KEY.F_MAJOR:
      return "F Major";
    case KEY.F_MINOR:
      return "F Minor";
    case KEY.F_SHARP_MAJOR:
      return "F-sharp Major";
    case KEY.F_SHARP_MINOR:
      return "F-sharp Minor";
    case KEY.G_FLAT_MAJOR:
      return "G-flat Major";
    case KEY.G_FLAT_MINOR:
      return "G-flat Minor";
    case KEY.G_MAJOR:
      return "G Major";
    case KEY.G_MINOR:
      return "G Minor";
    case KEY.G_SHARP_MAJOR:
      return "G-sharp Major";
    case KEY.G_SHARP_MINOR:
      return "G-sharp Minor";
    default:
      throw new Error(`Unknown key: ${key}`);
  }
}

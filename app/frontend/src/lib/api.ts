/**
 * Backend origin for browser calls. Override in `.env.local`:
 * `NEXT_PUBLIC_ RustAcademy_API_URL=https://api.example.com`
 */
export const get RustAcademyApiBase = (): string =>
  process.env.NEXT_PUBLIC_ RustAcademy_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

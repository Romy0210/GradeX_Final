import type { SVGProps } from "react";

export function GradeXLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"/>
    </svg>
  );
}

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.66 1.67-3.86 0-6.99-3.16-6.99-7.06s3.13-7.06 6.99-7.06c2.36 0 3.86 1.05 4.66 1.67l2.52-2.52C18.16 3.16 15.66 2 12.48 2 7.18 2 3 6.18 3 11.5s4.18 9.5 9.48 9.5c2.73 0 4.93-.91 6.57-2.55 1.64-1.64 2.05-4.03 2.05-6.71 0-.6-.05-1.15-.15-1.67z" />
    </svg>
  );
}

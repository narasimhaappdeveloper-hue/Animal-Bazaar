import { SVGProps } from "react";

export function CowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M14 3.16L12.53 3a3.84 3.84 0 0 0-2.32.14L5 5.5A4.3 4.3 0 0 0 3 9.4V14a1 1 0 0 0 1 1h2m2-13.84L15.47 3a3.84 3.84 0 0 1 2.32.14L23 5.5A4.3 4.3 0 0 1 25 9.4V14a1 1 0 0 1-1 1h-2M6 15h12M6 19v-4m12 4v-4m-9-2.5a2.5 2.5 0 0 0-5 0"
      ></path>
    </svg>
  );
}

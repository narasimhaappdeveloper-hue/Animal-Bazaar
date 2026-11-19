import { SVGProps } from "react";

export function PigeonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M22 8c-1 3-4.5 7-7.5 7.5S8 15 8 13.5s2-4 5-4s5-2.5 5-3.5s-2-2-2.5-2s-1 .5-1.5 1M8 13.5c-1.5 2.5-3 4-4.5 4M15 16l-2-2"
      ></path>
    </svg>
  );
}

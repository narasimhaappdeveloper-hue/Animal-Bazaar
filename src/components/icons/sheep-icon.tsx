import { SVGProps } from "react";

export function SheepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M11 12a5 5 0 1 0-7.75 4M11 12a1 1 0 1 0 2 0a1 1 0 0 0-2 0m2-1a2 2 0 1 0-4 0m10 5a5 5 0 1 0-7.75-4m-2.25-1a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 1a2 2 0 1 1-4 0"></path>
        <path d="M17 18a2 2 0 0 1 2 2v1h-4v-1a2 2 0 0 1 2-2m-8 0a2 2 0 0 0-2 2v1h4v-1a2 2 0 0 0-2-2"></path>
      </g>
    </svg>
  );
}

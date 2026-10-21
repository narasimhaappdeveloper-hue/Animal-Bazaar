import { SVGProps } from "react";

export function PigIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M15 11v-2a3 3 0 0 0-6 0v2"></path>
        <path
          d="M12 18.5A6.5 6.5 0 0 0 18.5 12H19a3 3 0 0 1 3 3v2a1 1 0 0 1-1 1h-1.5M12 18.5A6.5 6.5 0 0 1 5.5 12H5a3 3 0 0 0-3 3v2a1 1 0 0 0 1 1h1.5"
        ></path>
        <path d="M9.5 14.5a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1m5 0a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1"></path>
      </g>
    </svg>
  );
}

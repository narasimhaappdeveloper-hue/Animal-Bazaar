import { SVGProps } from "react";

export function OxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M12 12L7 7m5 5l5 5"></path>
        <path
          d="M17.5 4.5c-2.5 2.5-2.5 7.5-2.5 7.5s-5 0-7.5-2.5S3.25 4.75 5.5 3s5.5 1.5 5.5 1.5"
        ></path>
        <path
          d="M6.5 19.5c2.5-2.5 2.5-7.5 2.5-7.5s5 0 7.5 2.5s4.25 4.75 2 6.5s-5.5-1.5-5.5-1.5"
        ></path>
      </g>
    </svg>
  );
}

import { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";
import "./index.css";

export const GradientOld = ({
  className,
  ...props
}: ComponentProps<"svg">): ReactNode => (
  <svg
    id="visual"
    viewBox="0 0 900 600"
    preserveAspectRatio="none"
    {...props}
    className={cn(
      "fixed inset-0 -z-10 h-screen w-screen not-dark:hidden",
      className,
    )}
  >
    <defs>
      <filter
        id="blur1"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        ></feBlend>
        <feGaussianBlur
          stdDeviation="161"
          result="effect1_foregroundBlur"
        ></feGaussianBlur>
      </filter>
    </defs>
    <rect width="900" height="600" className="fill-background"></rect>
    <g filter="url(#blur1)">
      <circle cx="34" cy="490" r="357" className="fill-background"></circle>
      <circle cx="456" cy="0" r="357" className="fill-yellow-700"></circle>
      <circle cx="456" cy="180" r="200" className="fill-background"></circle>
      <circle cx="380" cy="431" r="357" className="fill-background"></circle>
      <circle cx="801" cy="300" r="357" className="fill-background"></circle>
      <circle cx="77" cy="458" r="357" className="fill-yellow-700"></circle>
      <circle cx="1280" cy="458" r="357" className="fill-yellow-700"></circle>
      <circle cx="240" cy="280" r="357" className="fill-background"></circle>
      {/* <g fill="#A7233A" className="fill-yellow-700">
        <circle r="81" cx="950" cy="200"></circle>
        <circle r="46" cx="49" cy="600"></circle>
        <circle r="47" cx="-70" cy="450"></circle>
        <circle r="54" cx="975" cy="406"></circle>
        <circle r="74" cx="470" cy="-50"></circle>
      </g> */}
    </g>
  </svg>
);

export const Background = ({
  className,
  ...props
}: ComponentProps<"svg">): ReactNode => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 1422 800"
    {...props}
    className={cn("maze fixed inset-0 -z-10 h-screen w-screen", className)}
  >
    {/* maze */}
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="transparent">
          <animate
            attributeName="stop-color"
            attributeType="CSS"
            values="transparent;var(--color-yellow-700);transparent;"
            dur="5s"
            repeatCount="indefinite"
          ></animate>
        </stop>
        <stop offset="100%" stopColor="var(--color-yellow-700)">
          <animate
            attributeName="stop-color"
            attributeType="CSS"
            values="var(--color-yellow-700);transparent;var(--color-yellow-700);"
            dur="5s"
            repeatCount="indefinite"
          ></animate>
        </stop>
      </linearGradient>
    </defs>
    <g
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="butt"
      className="stroke-muted-foreground/25 *:[line]:nth-[2n+1]:stroke-[url(#gradient1)]"
      // className="stroke-muted-foreground/25 *:[line]:even:stroke-yellow-600/70 dark:*:[line]:even:stroke-yellow-700/40"
    >
      <line x1="126" y1="0" x2="0" y2="126" opacity="0.59"></line>
      <line x1="126" y1="0" x2="252" y2="126" opacity="0.63"></line>
      <line x1="378" y1="0" x2="252" y2="126" opacity="0.45"></line>
      <line x1="378" y1="0" x2="504" y2="126" opacity="0.88"></line>
      <line x1="504" y1="0" x2="630" y2="126" opacity="0.83"></line>
      <line x1="630" y1="0" x2="756" y2="126" opacity="0.88"></line>
      <line x1="756" y1="0" x2="882" y2="126" opacity="0.31"></line>
      <line x1="1008" y1="0" x2="882" y2="126" opacity="0.76"></line>
      <line x1="1008" y1="0" x2="1134" y2="126" opacity="0.70"></line>
      <line x1="1260" y1="0" x2="1134" y2="126" opacity="0.49"></line>
      <line x1="1386" y1="0" x2="1260" y2="126" opacity="0.76"></line>
      <line x1="1386" y1="0" x2="1512" y2="126" opacity="0.07"></line>
      <line x1="0" y1="126" x2="126" y2="252" opacity="0.64"></line>
      <line x1="126" y1="126" x2="252" y2="252" opacity="0.72"></line>
      <line x1="252" y1="126" x2="378" y2="252" opacity="0.39"></line>
      <line x1="378" y1="126" x2="504" y2="252" opacity="0.08"></line>
      <line x1="504" y1="126" x2="630" y2="252" opacity="0.45"></line>
      <line x1="756" y1="126" x2="630" y2="252" opacity="0.27"></line>
      <line x1="756" y1="126" x2="882" y2="252" opacity="0.50"></line>
      <line x1="1008" y1="126" x2="882" y2="252" opacity="0.81"></line>
      <line x1="1008" y1="126" x2="1134" y2="252" opacity="0.32"></line>
      <line x1="1260" y1="126" x2="1134" y2="252" opacity="0.53"></line>
      <line x1="1386" y1="126" x2="1260" y2="252" opacity="0.19"></line>
      <line x1="1512" y1="126" x2="1386" y2="252" opacity="0.81"></line>
      <line x1="0" y1="252" x2="126" y2="378" opacity="0.17"></line>
      <line x1="126" y1="252" x2="252" y2="378" opacity="0.87"></line>
      <line x1="378" y1="252" x2="252" y2="378" opacity="0.59"></line>
      <line x1="378" y1="252" x2="504" y2="378" opacity="0.42"></line>
      <line x1="504" y1="252" x2="630" y2="378" opacity="0.75"></line>
      <line x1="756" y1="252" x2="630" y2="378" opacity="0.37"></line>
      <line x1="882" y1="252" x2="756" y2="378" opacity="0.21"></line>
      <line x1="1008" y1="252" x2="882" y2="378" opacity="0.26"></line>
      <line x1="1134" y1="252" x2="1008" y2="378" opacity="0.97"></line>
      <line x1="1134" y1="252" x2="1260" y2="378" opacity="0.93"></line>
      <line x1="1386" y1="252" x2="1260" y2="378" opacity="0.10"></line>
      <line x1="1512" y1="252" x2="1386" y2="378" opacity="0.11"></line>
      <line x1="126" y1="378" x2="0" y2="504" opacity="0.35"></line>
      <line x1="126" y1="378" x2="252" y2="504" opacity="0.32"></line>
      <line x1="252" y1="378" x2="378" y2="504" opacity="0.81"></line>
      <line x1="378" y1="378" x2="504" y2="504" opacity="0.44"></line>
      <line x1="630" y1="378" x2="504" y2="504" opacity="0.36"></line>
      <line x1="630" y1="378" x2="756" y2="504" opacity="0.97"></line>
      <line x1="756" y1="378" x2="882" y2="504" opacity="0.68"></line>
      <line x1="882" y1="378" x2="1008" y2="504" opacity="0.40"></line>
      <line x1="1008" y1="378" x2="1134" y2="504" opacity="0.19"></line>
      <line x1="1134" y1="378" x2="1260" y2="504" opacity="0.59"></line>
      <line x1="1260" y1="378" x2="1386" y2="504" opacity="0.47"></line>
      <line x1="1512" y1="378" x2="1386" y2="504" opacity="0.63"></line>
      <line x1="0" y1="504" x2="126" y2="630" opacity="0.43"></line>
      <line x1="126" y1="504" x2="252" y2="630" opacity="1.00"></line>
      <line x1="378" y1="504" x2="252" y2="630" opacity="0.62"></line>
      <line x1="378" y1="504" x2="504" y2="630" opacity="0.35"></line>
      <line x1="504" y1="504" x2="630" y2="630" opacity="0.25"></line>
      <line x1="756" y1="504" x2="630" y2="630" opacity="0.62"></line>
      <line x1="756" y1="504" x2="882" y2="630" opacity="0.81"></line>
      <line x1="882" y1="504" x2="1008" y2="630" opacity="0.97"></line>
      <line x1="1134" y1="504" x2="1008" y2="630" opacity="0.16"></line>
      <line x1="1134" y1="504" x2="1260" y2="630" opacity="0.37"></line>
      <line x1="1260" y1="504" x2="1386" y2="630" opacity="0.59"></line>
      <line x1="1512" y1="504" x2="1386" y2="630" opacity="0.22"></line>
      <line x1="126" y1="630" x2="0" y2="756" opacity="0.72"></line>
      <line x1="252" y1="630" x2="126" y2="756" opacity="0.44"></line>
      <line x1="378" y1="630" x2="252" y2="756" opacity="0.25"></line>
      <line x1="378" y1="630" x2="504" y2="756" opacity="0.41"></line>
      <line x1="504" y1="630" x2="630" y2="756" opacity="0.25"></line>
      <line x1="630" y1="630" x2="756" y2="756" opacity="0.31"></line>
      <line x1="756" y1="630" x2="882" y2="756" opacity="0.26"></line>
      <line x1="1008" y1="630" x2="882" y2="756" opacity="1.00"></line>
      <line x1="1134" y1="630" x2="1008" y2="756" opacity="0.54"></line>
      <line x1="1260" y1="630" x2="1134" y2="756" opacity="0.73"></line>
      <line x1="1260" y1="630" x2="1386" y2="756" opacity="0.94"></line>
      <line x1="1386" y1="630" x2="1512" y2="756" opacity="0.18"></line>
      <line x1="0" y1="756" x2="126" y2="882" opacity="0.67"></line>
      <line x1="252" y1="756" x2="126" y2="882" opacity="0.93"></line>
      <line x1="252" y1="756" x2="378" y2="882" opacity="0.66"></line>
      <line x1="504" y1="756" x2="378" y2="882" opacity="0.61"></line>
      <line x1="504" y1="756" x2="630" y2="882" opacity="0.68"></line>
      <line x1="756" y1="756" x2="630" y2="882" opacity="0.88"></line>
      <line x1="882" y1="756" x2="756" y2="882" opacity="0.16"></line>
      <line x1="882" y1="756" x2="1008" y2="882" opacity="0.19"></line>
      <line x1="1134" y1="756" x2="1008" y2="882" opacity="0.13"></line>
      <line x1="1260" y1="756" x2="1134" y2="882" opacity="0.77"></line>
      <line x1="1386" y1="756" x2="1260" y2="882" opacity="0.29"></line>
      <line x1="1386" y1="756" x2="1512" y2="882" opacity="0.33"></line>
    </g>

    {/* plaid */}
    {/* <g
      transform="scale(1.75) rotate(0) translate(0 0) skewX(0) skewY(0)"
      transform-origin="711 400"
      className="opacity-50"
    >
      <rect
        width="2844"
        height="1600"
        x="-711"
        y="-400"
        fill="url(#rrreplicate-pattern1)"
      ></rect>
      <rect
        width="2844"
        height="1600"
        x="-711"
        y="-400"
        fill="url(#rrreplicate-pattern2)"
      ></rect>
      <rect
        width="2844"
        height="1600"
        x="-711"
        y="-400"
        fill="url(#rrreplicate-pattern3)"
      ></rect>
    </g>
    <defs>
      <pattern
        id="rrreplicate-pattern1"
        width="412"
        height="412"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(30)"
        strokeWidth="4"
        fill="none"
        stroke="#7c8cce"
        strokeOpacity="0.48"
        className="stroke-muted-foreground"
      >
        <line x1="51.5" y1="0" x2="51.5" y2="412"></line>
        <line x1="154.5" y1="0" x2="154.5" y2="412"></line>
        <line x1="257.5" y1="0" x2="257.5" y2="412"></line>
        <line x1="360.5" y1="0" x2="360.5" y2="412"></line>
      </pattern>
      <pattern
        id="rrreplicate-pattern2"
        width="412"
        height="412"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(30)"
        strokeOpacity="0.67"
        strokeWidth="2.2"
        fill="none"
        stroke="#238968"
        className="stroke-yellow-900"
      >
        <line x1="103" y1="0" x2="103" y2="412"></line>
        <line x1="309" y1="0" x2="309" y2="412"></line>
      </pattern>
      <pattern
        id="rrreplicate-pattern3"
        width="412"
        height="412"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(115)"
        strokeOpacity="1"
        strokeWidth="1.2"
        fill="none"
        stroke="#ffcb00"
        className="stroke-yellow-500"
      >
        <line x1="51.5" y1="0" x2="51.5" y2="412"></line>
        <line x1="154.5" y1="0" x2="154.5" y2="412"></line>
        <line x1="257.5" y1="0" x2="257.5" y2="412"></line>
        <line x1="360.5" y1="0" x2="360.5" y2="412"></line>
      </pattern>
    </defs> */}
  </svg>
);
export const SatoriGradient = (): ReactNode => (
  <svg
    id="visual"
    viewBox="0 0 900 600"
    preserveAspectRatio="none"
    width={"900"}
    height={"600"}
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      // zIndex: "-10",
    }}
  >
    <defs>
      <filter
        id="blur1"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        ></feBlend>
        <feGaussianBlur
          stdDeviation="161"
          result="effect1_foregroundBlur"
        ></feGaussianBlur>
      </filter>
    </defs>
    <rect
      width="900"
      height="600"
      style={{
        fill: "black",
      }}
    ></rect>
    <g filter="url(#blur1)">
      <circle
        cx="34"
        cy="490"
        r="357"
        style={{
          fill: "black",
        }}
      ></circle>
      <circle cx="456" cy="0" r="357" style={{ fill: "#a65f00" }}></circle>
      <circle
        cx="456"
        cy="180"
        r="200"
        style={{
          fill: "black",
        }}
      ></circle>
      <circle
        cx="380"
        cy="431"
        r="357"
        style={{
          fill: "black",
        }}
      ></circle>
      <circle
        cx="801"
        cy="300"
        r="357"
        style={{
          fill: "black",
        }}
      ></circle>
      <circle cx="77" cy="458" r="357" style={{ fill: "#a65f00" }}></circle>
      <circle cx="1280" cy="458" r="357" style={{ fill: "#a65f00" }}></circle>
      <circle
        cx="240"
        cy="280"
        r="357"
        style={{
          fill: "black",
        }}
      ></circle>
    </g>
  </svg>
);

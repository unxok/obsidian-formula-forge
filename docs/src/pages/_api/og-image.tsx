import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "fs/promises";

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  const title = url.searchParams.get("title");
  const description = url.searchParams.get("description");

  const svg =
    title && description
      ? await getSvg(url.origin, title, description)
      : await getDefaultSvg(url.origin);

  const png = new Resvg(svg).render().asPng();
  return new Response(Buffer.from(png), {
    headers: {
      "Content-Type": "image/png",
    },
  });
};

const getSvg = async (
  origin: string,
  title: string,
  description: string,
): Promise<string> => {
  return await satori(
    <div
      style={{
        display: "flex",
        position: "absolute",
        width: "100%",
        height: "100%",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "white",
      }}
    >
      <img src={origin + "/images/og-bg.png"} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          // justifyContent: "flex-start",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          width: "80%",
        }}
      >
        <h1
          style={{
            fontSize: "90px",
            display: "block",
            lineClamp: 1,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "60px",
            display: "block",
            lineClamp: 2,
            color: "rgb(180, 180, 180)",
          }}
        >
          {description}
        </p>
      </div>
      <img
        src={origin + "/images/title-header.png"}
        width={500}
        style={{
          position: "absolute",
          bottom: 50,
          right: 50,
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: await readFile(
            new URL(
              "../../assets/fonts/Inter_18pt-Medium.ttf",
              import.meta.url,
            ),
          ),
          weight: 500,
        },
        {
          name: "Inter",
          data: await readFile(
            new URL("../../assets/fonts/Inter_18pt-Bold.ttf", import.meta.url),
          ),
          weight: 700,
        },
      ],
    },
  );
};

const getDefaultSvg = async (origin: string): Promise<string> => {
  return await satori(
    <div
      style={{
        display: "flex",
        position: "absolute",
        width: "100%",
        height: "100%",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "white",
      }}
    >
      <img src={origin + "/images/og-bg.png"} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          // justifyContent: "flex-start",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
        }}
      >
        <img
          src={origin + "/images/title-header.png"}
          width={500}
          style={
            {
              // position: "absolute",
              // bottom: 50,
              // right: 50,
            }
          }
        />
        <p
          style={{
            fontSize: "55px",
            display: "block",
            lineClamp: 2,
            color: "rgb(180, 180, 180)",
          }}
        >
          Take Obsidian formulas even further
        </p>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: await readFile(
            new URL(
              "../../assets/fonts/Inter_18pt-Medium.ttf",
              import.meta.url,
            ),
          ),
          weight: 500,
        },
        {
          name: "Inter",
          data: await readFile(
            new URL("../../assets/fonts/Inter_18pt-Bold.ttf", import.meta.url),
          ),
          weight: 700,
        },
      ],
    },
  );
};

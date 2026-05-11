import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#C98B8B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#FEF9F7",
            fontSize: 22,
            fontFamily: "serif",
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          C
        </span>
      </div>
    ),
    { width: 32, height: 32 }
  );
}

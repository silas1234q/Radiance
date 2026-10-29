import Svg, { Path, Circle } from "react-native-svg";

export function FaceConnector() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 360 700"
      style={{
        position: "absolute",
        top: -100,
        left: 0,
      }}
      pointerEvents="none"
    >
      {/* Face to first card */}
      <Path
        d="M 205 165 Q 230 135 270 135"
        stroke="white"
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={205} cy={165} r={3} fill="white" />

      {/* Face to second card */}
      <Path
        d="M 215 300 Q 240 270 270 265"
        stroke="white"
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={215} cy={300} r={3} fill="white" />

      {/* Face to third card */}
      <Path
        d="M 195 420 Q 230 390 270 395"
        stroke="white"
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={195} cy={420} r={3} fill="white" />

      {/* Face to fourth card */}
      <Path
        d="M 205 520 Q 240 545 270 525"
        stroke="white"
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={205} cy={520} r={3} fill="white" />
    </Svg>
  );
}
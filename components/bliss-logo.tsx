import Svg, { Circle, Defs, LinearGradient, Polygon, Stop } from "react-native-svg";

export function BlissLogo({ size = 48 }: { size?: number }) {
  const starPoints = "256,38 309,184 462,190 340,281 380,438 256,350 132,438 172,281 50,190 203,184";

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" accessibilityLabel="BLISS logo">
      <Defs>
        <LinearGradient id="neonGradient" x1="52" y1="44" x2="462" y2="456" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#22D9FF" />
          <Stop offset="0.48" stopColor="#4C9CFF" />
          <Stop offset="1" stopColor="#9A4DFF" />
        </LinearGradient>
      </Defs>
      <Polygon points={starPoints} stroke="url(#neonGradient)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="256" cy="256" r="128" stroke="url(#neonGradient)" strokeWidth={16} />
      <Circle cx="256" cy="256" r="15" fill="#F6FBFF" />
    </Svg>
  );
}

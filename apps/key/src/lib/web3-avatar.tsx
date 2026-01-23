"use client";

interface Web3AvatarProps {
  address: string;
  size?: number;
  className?: string;
}

export function getGradientColors(address: string): [string, string] {
  const hex = address.toLowerCase().replace("0x", "");

  const hue1 = parseInt(hex.slice(0, 6), 16) % 360;
  const hue2 = parseInt(hex.slice(6, 12), 16) % 360;
  const sat1 = 60 + (parseInt(hex.slice(12, 14), 16) % 30);
  const sat2 = 60 + (parseInt(hex.slice(14, 16), 16) % 30);
  const light1 = 50 + (parseInt(hex.slice(16, 18), 16) % 20);
  const light2 = 50 + (parseInt(hex.slice(18, 20), 16) % 20);

  return [
    `hsl(${hue1}, ${sat1}%, ${light1}%)`,
    `hsl(${hue2}, ${sat2}%, ${light2}%)`,
  ];
}

function getGradientAngle(address: string): number {
  const hex = address.toLowerCase().replace("0x", "");
  return parseInt(hex.slice(20, 24), 16) % 360;
}

export function Web3Avatar({ address, size = 48, className = "" }: Web3AvatarProps) {
  const [color1, color2] = getGradientColors(address);
  const angle = getGradientAngle(address);

  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
      }}
      aria-label={`Avatar for ${address.slice(0, 6)}...${address.slice(-4)}`}
    />
  );
}

/**
 * Web3 Avatar Generation
 *
 * Generates beautiful gradient avatars from Ethereum addresses.
 * Based on web3-avatar by JackHamer09 (MIT License).
 *
 * @see https://github.com/JackHamer09/web3-avatar
 */

export function getGradientColors(address: string): string[] {
  const seedArr = address.match(/.{1,7}/g)?.splice(0, 5);
  const colors: string[] = [];

  seedArr?.forEach((seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const rgb = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 255;
      rgb[i] = value;
    }
    colors.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  });

  return colors;
}

export function getWeb3AvatarStyles(address: string): React.CSSProperties {
  const colors = getGradientColors(address);
  return {
    backgroundColor: colors[0] || "#ccc",
    backgroundImage: `
      radial-gradient(at 66% 77%, ${colors[1]} 0px, transparent 50%),
      radial-gradient(at 29% 97%, ${colors[2]} 0px, transparent 50%),
      radial-gradient(at 99% 86%, ${colors[3]} 0px, transparent 50%),
      radial-gradient(at 29% 88%, ${colors[4]} 0px, transparent 50%)
    `.trim(),
    borderRadius: "50%",
    boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
  };
}

interface Web3AvatarProps {
  address: string;
  size?: number;
  className?: string;
}

export function Web3Avatar({ address, size = 48, className = "" }: Web3AvatarProps) {
  const styles = getWeb3AvatarStyles(address);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        ...styles,
      }}
    />
  );
}

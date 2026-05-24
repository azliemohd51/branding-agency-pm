// Version: 1.0
import { initials } from "@/lib/strings";

export function Avatar({
  name,
  color = "#7c5cff",
  size = 28,
  ring = false,
}: {
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${
        ring ? "ring-2 ring-bg-0" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        fontSize: Math.max(10, Math.floor(size * 0.4)),
      }}
      title={name}
    >
      {initials(name) || "?"}
    </div>
  );
}

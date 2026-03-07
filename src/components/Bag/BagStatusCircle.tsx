type BagStatus = "active" | "discarded" | "worthless" | "for_trade";

const STATUS_CONFIG: Record<BagStatus, { label: string; bgColor: string }> = {
  active: { label: "Aktiv", bgColor: "bg-emerald-500" },
  discarded: { label: "Bortkastad", bgColor: "bg-stone-500" },
  worthless: { label: "Värdelös", bgColor: "bg-red-500/80" },
  for_trade: { label: "Vill byta/sälja", bgColor: "bg-amber-400" },
};

type Props = {
  status: string;
  className?: string;
};

export default function BagStatusCircle({ status, className = "" }: Props) {
  const key = status as BagStatus;
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.active;
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full shrink-0 ${config.bgColor} ${className}`}
      title={config.label}
      aria-label={config.label}
      role="img"
    />
  );
}

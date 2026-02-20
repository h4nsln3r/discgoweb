import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type BackLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-200 transition"
      }
    >
      <ArrowLeftIcon className="h-5 w-5 shrink-0" />
      <span>{children}</span>
    </Link>
  );
}

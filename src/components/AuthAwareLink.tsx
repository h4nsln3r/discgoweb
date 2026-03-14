"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type Props = {
  href: string;
  isGuest: boolean;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

/**
 * Länk som vid klick som gäst (isGuest) skickar användaren till inloggning med redirect till href.
 * Annars fungerar som vanlig Next Link.
 */
export default function AuthAwareLink({ href, isGuest, className, children, ariaLabel }: Props) {
  const router = useRouter();

  const handleGuestClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const redirectUrl = `/auth?redirect=${encodeURIComponent(href)}`;
      router.push(redirectUrl);
    },
    [href, router]
  );

  if (isGuest) {
    return (
      <a
        href={href}
        onClick={handleGuestClick}
        className={className}
        aria-label={ariaLabel}
        role="link"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

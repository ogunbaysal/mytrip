import type { ReactNode } from "react";

import Link from "next/link";

const companyLinks = [
  { label: "MyTrip hakkında", href: "/about" },
  { label: "Kariyer", href: "/careers" },
  { label: "Basın", href: "/press" },
];

const exploreLinks = [
  { label: "Seyahat dergisi", href: "/blog" },
  { label: "Hediye kartları", href: "/collections" },
];

const supportLinks = [
  { label: "Yardım merkezi", href: "/support" },
  { label: "İletişim", href: "/contact" },
];

const legalLinks = [
  { label: "Gizlilik", href: "/privacy" },
  { label: "Şartlar", href: "/terms" },
  { label: "Çerezler", href: "/cookies" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="text-xl font-semibold text-primary">
              MyTrip
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              Muğla&apos;da sevgiyle tasarlandı
            </p>
          </div>
          <FooterColumn title="Şirket">
            {companyLinks.map((item) => (
              <FooterLink key={item.href} href={item.href} label={item.label} />
            ))}
          </FooterColumn>
          <FooterColumn title="Keşfet">
            {exploreLinks.map((item) => (
              <FooterLink key={item.href} href={item.href} label={item.label} />
            ))}
          </FooterColumn>
          <FooterColumn title="Destek">
            {supportLinks.map((item) => (
              <FooterLink key={item.href} href={item.href} label={item.label} />
            ))}
          </FooterColumn>
        </div>
        <div className="flex flex-col gap-4 border-t border-border/50 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} MyTrip</span>
          <div className="flex flex-wrap items-center gap-4">
            {legalLinks.map((item) => (
              <FooterLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  children: ReactNode;
};

function FooterColumn({ title, children }: FooterColumnProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide text-foreground/80">{title}</h3>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

type FooterLinkProps = {
  href: string;
  label: string;
};

function FooterLink({ href, label }: FooterLinkProps) {
  return (
    <Link href={href} className="transition hover:text-foreground">
      {label}
    </Link>
  );
}

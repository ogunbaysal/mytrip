import type { ReactNode } from "react";

import Link from "next/link";
import type { Route } from "next";

type FooterLinkProps = {
  href: Route;
  label: string;
  className?: string;
  title?: string;
};

const companyLinks = [
  { label: "TatilDesen hakkında", href: "/about" },
  { label: "Kariyer", href: "/careers" },
  { label: "Destek", href: "/support" },
] as const satisfies FooterLinkProps[];

const exploreLinks = [
  { label: "Blog Listesi", href: "/blog" },
  { label: "Hediye kartları", href: "/collections" },
] as const satisfies FooterLinkProps[];

const supportLinks = [
  { label: "Yardım merkezi", href: "/support" },
  { label: "İletişim", href: "/contact" },
] as const satisfies FooterLinkProps[];

const coreLegalLinks = [
  { label: "Gizlilik", href: "/privacy" },
  { label: "Şartlar", href: "/terms" },
  { label: "Çerezler", href: "/cookies" },
] as const satisfies FooterLinkProps[];

const agreementLinks = [
  {
    label: "Bireysel Üyelik",
    title: "Bireysel Üyelik ve İlan Yayınlama Sözleşmesi",
    href: "/bireysel-uyelik-ve-ilan-yayinlama-sozlesmesi" as Route,
  },
  {
    label: "Kurumsal Üyelik",
    title: "Kurumsal Üyelik ve Mağaza Sözleşmesi",
    href: "/kurumsal-uyelik-ve-magaza-sozlesmesi" as Route,
  },
  {
    label: "Mesafeli Satış",
    title: "Mesafeli Satış Sözleşmesi",
    href: "/mesafeli-satis-sozlesmesi" as Route,
  },
  {
    label: "Açık Rıza Metni",
    title: "Üyelik Açık Rıza Metni",
    href: "/uyelik-acik-riza-metni" as Route,
  },
] as const satisfies FooterLinkProps[];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="space-y-3">
            <Link href="/" className="text-xl font-semibold text-primary">
              TatilDesen
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
          <FooterColumn title="Yasal">
            {agreementLinks.map((item) => (
              <FooterLink
                key={item.href}
                href={item.href}
                label={item.label}
                title={item.title}
              />
            ))}
          </FooterColumn>
        </div>
        <div className="flex flex-col gap-4 border-t border-border/50 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} TatilDesen</span>
          <div className="flex flex-wrap items-center gap-4">
            {coreLegalLinks.map((item) => (
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

function FooterLink({ href, label, className, title }: FooterLinkProps) {
  return (
    <Link
      href={href}
      title={title}
      className={`transition hover:text-foreground ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}

import Link from "next/link"

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t bg-background px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="text-sm font-bold text-primary-foreground">S</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  DOBROW Academy
                </span>
                <span className="text-xs text-muted-foreground">
                  AI career transitions
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              A learning platform for people transitioning into AI careers
              through structured roadmaps, practical projects, and guided
              progress.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: "Programs", href: "#programs" },
              { label: "Roadmaps", href: "#roadmaps" },
              { label: "Projects", href: "#projects" },
              { label: "Pricing", href: "#pricing" },
            ]}
          />

          <FooterColumn
            title="Company"
            links={[
              { label: "About", href: "#" },
              { label: "Testimonials", href: "#testimonials" },
              { label: "FAQ", href: "#faq" },
              { label: "Contact", href: "#" },
            ]}
          />

          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Cookies", href: "#" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DOBROW Academy. All rights reserved.</p>
          <p>Built for people moving into AI professions.</p>
        </div>
      </div>
    </footer>
  )
}

import Link from "next/link";
import { Container } from "@/components/share/Container";
import type { LegalDocument } from "@/config/legal";

/**
 * One legal document: the date it last changed, its opening, then its clauses.
 *
 * A single measured column rather than the site's usual two-up layouts — this is
 * text to be read in order, and the only thing that helps is a comfortable line
 * length. The clause list on the side is what makes it navigable.
 */
export function LegalDoc({
  doc,
  contactHref = "/contact",
}: {
  doc: LegalDocument;
  contactHref?: string;
}) {
  return (
    <section className="pt-10 pb-16 sm:pt-14 sm:pb-20 xl:pb-22.5">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-14">
          {/* On this page — sticky beside the text from `lg`, a plain list above it
              below that, where there is no room for a sidebar. */}
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[12px]! font-semibold! tracking-[0.08em] text-panel-muted uppercase">
              On this page
            </p>
            <ul className="mt-3.5 flex flex-col gap-2.5 border-s border-border ps-4">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-[13px]! leading-snug! text-panel-muted transition-colors hover:text-primary"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0 max-w-[68ch]">
            <p className="text-[12.5px]! font-semibold! tracking-[0.06em] text-panel-muted uppercase">
              Last updated {doc.updated}
            </p>

            {doc.intro.map((paragraph, i) => (
              <p
                key={i}
                className="mt-4 text-[15.5px]! leading-[1.8]! text-panel-fg first-of-type:text-[17px]!"
              >
                {paragraph}
              </p>
            ))}

            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="mt-10 scroll-mt-28">
                <h2 className="text-[20px]! leading-tight! font-bold! tracking-[-0.02em] text-panel-fg sm:text-[22px]!">
                  {section.heading}
                </h2>

                {section.body.map((paragraph, i) => (
                  <p key={i} className="mt-3.5 text-[15px]! leading-[1.8]! text-panel-muted">
                    {paragraph}
                  </p>
                ))}

                {section.list && (
                  <ul className="mt-3.5 flex flex-col gap-2.5">
                    {section.list.map((item, i) => (
                      <li
                        key={i}
                        className="relative ps-5 text-[15px]! leading-[1.75]! text-panel-muted"
                      >
                        <span
                          aria-hidden
                          className="absolute start-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-primary/60"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <p className="mt-10 border-t border-border pt-6 text-[14.5px]! leading-[1.8]! text-panel-muted">
              Still unsure about something here?{" "}
              <Link href={contactHref} className="font-semibold! text-primary hover:underline">
                Get in touch
              </Link>
              .
            </p>
          </article>
        </div>
      </Container>
    </section>
  );
}

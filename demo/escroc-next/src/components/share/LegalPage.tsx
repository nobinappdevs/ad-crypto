import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";

type Section = { title: string; body: string };

/** Shared layout for long-form policy pages (Privacy, Refund, Terms). */
export function LegalPage({
  tag,
  title,
  subtitle,
  sections,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  sections: Section[];
}) {
  return (
    <section className="bg-bg py-24 lg:py-32">
      <Container className="max-w-3xl">
        <SectionHeader tag={tag} title={title} align="center" />
        {subtitle && (
          <p className="mx-auto mt-5 max-w-xl text-center leading-relaxed text-muted">{subtitle}</p>
        )}

        <div className="mt-14 space-y-10">
          {sections.map((s) => (
            <div key={s.title} className="border-b border-border pb-10 last:border-0 last:pb-0">
              <h3>{s.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

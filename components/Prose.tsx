// Dashboard text uses a tiny markup: "## " headings, "- " list items, blank line between paragraphs. Plain text only.
type Block = { title?: string; paragraphs: string[]; items: string[] };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block = { paragraphs: [], items: [] };
  for (const chunk of text.replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].startsWith("## ")) {
      if (current.title || current.paragraphs.length || current.items.length) blocks.push(current);
      current = { title: lines.shift()!.slice(3), paragraphs: [], items: [] };
    }
    const items = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
    const prose = lines.filter((l) => !l.startsWith("- ")).join(" ");
    if (prose) current.paragraphs.push(prose);
    current.items.push(...items);
  }
  blocks.push(current);
  return blocks.filter((b) => b.title || b.paragraphs.length || b.items.length);
}

function Body({ block }: { block: Block }) {
  return (
    <>
      {block.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {block.items.length > 0 && (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Running text: headings, paragraphs and lists in one column. */
export function Prose({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`prose ${className}`}>
      {parse(text).map((b, i) => (
        <div key={i}>
          {b.title && <h2>{b.title}</h2>}
          <Body block={b} />
        </div>
      ))}
    </div>
  );
}

/** The same text as numbered cards, one per heading (service pages). */
export function Blocks({ text }: { text: string }) {
  return (
    <div className="blocks">
      {parse(text).map((b, i) => (
        <section key={i} className="block prose">
          <span className="block__num" dir="ltr" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          {b.title && <h2>{b.title}</h2>}
          <Body block={b} />
        </section>
      ))}
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

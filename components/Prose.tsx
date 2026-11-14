// Renders dashboard text: "## " headings, "- " list items, blank line between paragraphs. Plain text only, no HTML.
export function Prose({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`prose ${className}`}>
      {blocks.flatMap((block, i) => {
        const lines = block.split("\n");
        const out: React.ReactNode[] = [];
        let rest = lines;
        if (lines[0].startsWith("## ")) {
          out.push(<h2 key={`h${i}`}>{lines[0].slice(3)}</h2>);
          rest = lines.slice(1);
        }
        if (rest.length && rest.every((l) => l.startsWith("- "))) {
          out.push(
            <ul key={`u${i}`}>
              {rest.map((l) => (
                <li key={l}>{l.slice(2)}</li>
              ))}
            </ul>,
          );
        } else if (rest.length) {
          out.push(<p key={`p${i}`}>{rest.join(" ")}</p>);
        }
        return out;
      })}
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

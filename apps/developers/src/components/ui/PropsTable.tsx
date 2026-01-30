import { Badge } from "./Badge";

export interface PropRow {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
}

interface PropsTableProps {
  props: PropRow[];
}

export function PropsTable({ props }: PropsTableProps) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/5 bg-cream-100">
            <th className="text-left p-3 font-medium">Prop</th>
            <th className="text-left p-3 font-medium">Type</th>
            <th className="text-left p-3 font-medium">Default</th>
            <th className="text-left p-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-ink/5 last:border-0">
              <td className="p-3 font-mono text-accent-yellow align-top">
                {prop.name}
                {prop.required && (
                  <Badge variant="error" className="ml-2">
                    Required
                  </Badge>
                )}
              </td>
              <td className="p-3 font-mono text-xs text-ink/80 align-top">
                {prop.type}
              </td>
              <td className="p-3 font-mono text-xs text-ink-muted align-top">
                {prop.default || "—"}
              </td>
              <td className="p-3 text-ink-muted align-top leading-relaxed">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Badge } from "./Badge";

interface APISignatureProps {
  method: string;
  params?: string;
  returnType?: string;
  deprecated?: boolean;
}

export function APISignature({
  method,
  params,
  returnType,
  deprecated,
}: APISignatureProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-ink/[0.02] rounded-lg border border-ink/5 font-mono text-sm">
      <div className="flex-1">
        <code className="text-accent-yellow">{method}</code>
        {params && <code className="text-ink/60">({params})</code>}
        {returnType && (
          <>
            <code className="text-ink-muted mx-2">→</code>
            <code className="text-ink">{returnType}</code>
          </>
        )}
      </div>
      {deprecated && (
        <Badge variant="warning" className="flex-shrink-0">
          Deprecated
        </Badge>
      )}
    </div>
  );
}

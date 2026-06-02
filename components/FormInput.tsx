import { cn } from "@/lib/cn";

/**
 * Accessible form field primitives. Each pairs a real <label> with its
 * control via htmlFor/id. Inputs use a quiet underline-on-parchment style
 * that fits the editorial system.
 */

const fieldClass =
  "w-full border-b border-line bg-transparent py-3 font-sans text-body text-ink placeholder:text-taupe/70 transition-colors duration-300 focus:border-fig focus:outline-none";

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
};

function FieldShell({ id, label, required, hint, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label text-charcoal">
        {label}
        {required && <span className="text-fig"> *</span>}
      </label>
      {children}
      {hint && <p className="text-meta text-taupe">{hint}</p>}
    </div>
  );
}

export function TextField({
  id,
  label,
  required,
  hint,
  type = "text",
  ...rest
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint}>
      <input id={id} name={id} type={type} required={required} className={fieldClass} {...rest} />
    </FieldShell>
  );
}

export function TextArea({
  id,
  label,
  required,
  hint,
  rows = 5,
  ...rest
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        required={required}
        className={cn(fieldClass, "resize-none")}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  required,
  hint,
  options,
  ...rest
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint}>
      <select id={id} name={id} required={required} className={cn(fieldClass, "cursor-pointer")} {...rest}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

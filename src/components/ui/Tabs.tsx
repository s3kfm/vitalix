export function Tabs<T extends string>({ options, value, onChange }: { options: readonly T[]; value: NoInfer<T>; onChange: (value: NoInfer<T>) => void }) {
  return <div className="tabs" aria-label="View">{options.map(option => <button key={option} aria-pressed={value === option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

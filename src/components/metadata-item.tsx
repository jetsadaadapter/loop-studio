type MetadataItemProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

export function MetadataItem({
  label,
  value,
  valueClassName = "mt-0.5 text-slate-600",
}: MetadataItemProps) {
  return (
    <div>
      <p className="font-semibold text-slate-900">{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}

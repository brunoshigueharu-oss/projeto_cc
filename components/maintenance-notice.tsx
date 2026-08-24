type MaintenanceNoticeProps = {
  title: string;
  description: string;
};

export function MaintenanceNotice({ title, description }: MaintenanceNoticeProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-4 font-serif text-muted-foreground">{description}</p>
    </div>
  );
}

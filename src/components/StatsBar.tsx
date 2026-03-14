const stats = [
  { icon: "👥", label: "1000+ Served" },
  { icon: "⭐", label: "4.7/5 Rating" },
  { icon: "💇", label: "Hair, Skin, Makeup" },
  { icon: "🧼", label: "Hygiene Focused" },
];

const StatsBar = () => {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {stats.map((stat) => (
        <span
          key={stat.label}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-card border border-border rounded-full px-3 py-1.5 text-foreground shadow-sm"
        >
          <span>{stat.icon}</span>
          {stat.label}
        </span>
      ))}
    </div>
  );
};

export default StatsBar;

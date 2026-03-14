const Header = () => {
  return (
    <header className="w-full px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <img
          src="https://cdn4.singleinterface.com/files/outlet/logo/334963/Brand_logo_1_png_png.png"
          alt="Lakme Salon Logo"
          className="h-12 w-12 rounded-full object-contain bg-card border border-border shadow-sm"
        />
        <span className="text-xs font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
          ✨ Powered by AI
        </span>
      </div>
      <h1 className="font-display text-xl font-bold text-foreground leading-tight mb-1">
        Lakme Salon Review Assistant
      </h1>
      <p className="text-sm text-muted-foreground">
        Write a genuine review in under 60 seconds.
      </p>
    </header>
  );
};

export default Header;

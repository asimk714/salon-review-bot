const Header = () => {
  return (
    <header className="w-full px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <img
          src="https://cdn4.singleinterface.com/files/outlet/logo/334963/Brand_logo_1_png_png.png"
          alt="Lakme Salon logo"
          className="h-12 w-12 rounded-full object-contain bg-card border border-border shadow-sm"
        />
      </div>
      <h1 className="font-display text-xl font-bold text-foreground leading-tight mb-1">
        Lakme Salon Review Assistant
      </h1>
      <p className="text-sm text-muted-foreground">
        Draft an honest review from your experience. Edit it before you post.
      </p>
    </header>
  );
};

export default Header;

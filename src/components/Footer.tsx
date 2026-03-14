const Footer = () => (
  <footer className="px-4 py-6 text-center space-y-3 border-t border-border">
    <p className="text-xs text-muted-foreground leading-relaxed">
      Your words are your own. This tool only helps you express your experience clearly. Please post honest feedback.
    </p>
    <div className="text-xs text-muted-foreground">
      <span>Powered by </span>
      <a
        href="mailto:contact@futureagents.ai"
        className="text-secondary hover:underline font-medium"
      >
        Future Agents
      </a>
      <span className="mx-1">·</span>
      <a
        href="mailto:contact@futureagents.ai"
        className="text-secondary hover:underline"
      >
        Create this for your business
      </a>
    </div>
  </footer>
);

export default Footer;

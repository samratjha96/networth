export const Header = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Argos
        </h1>
        <p className="text-xs text-muted-foreground">
          Your all-seeing financial guardian
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Demo Mode</span>
      </div>
    </div>
  );
};

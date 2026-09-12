interface ClayIllustrationProps {
  variant?: 'hero' | 'compact';
}

export default function ClayIllustration({ variant = 'hero' }: ClayIllustrationProps) {
  return (
    <div className={`clay-illustration ${variant}`} aria-hidden="true">
      <div className="clay-scene">
        <div className="clay-sun" />
        <div className="clay-cloud clay-cloud-1" />
        <div className="clay-cloud clay-cloud-2" />
        <div className="clay-hill clay-hill-back" />
        <div className="clay-hill clay-hill-mid" />
        <div className="clay-hill clay-hill-front" />
        <div className="clay-link-icon">
          <span>🔗</span>
        </div>
      </div>
    </div>
  );
}

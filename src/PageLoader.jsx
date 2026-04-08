function PageLoader({ label = 'Connecting to server...' }) {
  const bars = Array.from({ length: 5 }, (_, index) => index);

  return (
    <div className="page-loader-shell" role="status" aria-live="polite" aria-label={label}>
      <div className="page-loader">
        <div className="page-loader__animation" aria-hidden="true">
          {bars.map((index) => (
            <div key={index} className={`page-loader__bar page-loader__bar--${index + 1}`} />
          ))}
          <div className="page-loader__ball" />
        </div>
        <p className="page-loader__label">{label}</p>
      </div>
    </div>
  );
}

export default PageLoader;

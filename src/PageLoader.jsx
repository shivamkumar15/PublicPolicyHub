const BOXES = Array.from({ length: 8 }, (_, index) => index);

function PageLoader({ label = 'Connecting to server...' }) {
  return (
    <div className="page-loader-shell" role="status" aria-live="polite" aria-label={label}>
      <div className="page-loader">
        <div className="page-loader__scene" aria-hidden="true">
          {BOXES.map((index) => (
            <div key={index} className={`page-loader__box page-loader__box--${index}`}>
              <div />
            </div>
          ))}
          <div className="page-loader__ground">
            <div />
          </div>
        </div>
        <p className="page-loader__label">{label}</p>
      </div>
    </div>
  );
}

export default PageLoader;

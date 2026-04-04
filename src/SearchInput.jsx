function SearchInput({
  ariaLabel = 'Search posts and people',
  inputRef,
  onChange,
  onClear,
  onFocus,
  onKeyDown,
  placeholder = 'Search..',
  showClear = false,
  value,
}) {
  return (
    <div className="policy-search">
      <div className="policy-search__container">
        <input
          id="policy-search-input"
          type="search"
          name="search"
          ref={inputRef}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          className="policy-search__input"
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </div>
      {showClear && (
        <button type="button" onClick={onClear} className="policy-search__clear">
          Clear
        </button>
      )}
    </div>
  );
}

export default SearchInput;

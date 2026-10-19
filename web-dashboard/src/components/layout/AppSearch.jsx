import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";

/**
 * AppSearch — the top bar search.
 *
 * It is a real control, not a decorative field: every result it offers
 * navigates somewhere that exists. Two kinds of result are offered, because
 * this product has exactly two things worth jumping to:
 *
 *   PAGES    the six destinations in the rail (seven for an admin), matched by
 *            label.
 *   RECORDS  the readings still in the live buffer, matched by sensor point,
 *            risk level or clock time. Picking one opens the history page,
 *            which is where the full record lives.
 *
 * It follows the combobox pattern: the input owns `aria-expanded` and
 * `aria-activedescendant`, the popup is a listbox, and Arrow keys, Enter and
 * Escape all work without a mouse.
 */

const MAX_RECORDS = 5;

/** Highlighted item index is tracked across both groups, so one flat index is used. */
const AppSearch = ({ links = [] }) => {
  const { language, history } = useInsole();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const needle = query.trim().toLowerCase();

  const pageResults = useMemo(() => {
    if (!needle) return [];
    return links.filter((link) => link.label.toLowerCase().includes(needle));
  }, [links, needle]);

  const recordResults = useMemo(() => {
    if (!needle) return [];
    return [...history]
      .reverse()
      .filter((record) => {
        const peak = Number(record.peakPressure || 0);
        const time = new Date(record.timestamp).toLocaleTimeString(
          language === "id" ? "id-ID" : "en-GB"
        );
        const zone = ["forefoot", "midfoot", "heel"].some((key) =>
          t(`anatomy.${key}.short`, language).toLowerCase().includes(needle)
        );
        return (
          t(`risk.${record.risk}`, language).toLowerCase().includes(needle) ||
          time.toLowerCase().includes(needle) ||
          zone ||
          String(peak).includes(needle)
        );
      })
      .slice(0, MAX_RECORDS);
  }, [history, needle, language]);

  const results = useMemo(
    () => [
      ...pageResults.map((link) => ({ kind: "page", id: link.id, link })),
      ...recordResults.map((record) => ({
        kind: "record",
        id: `${record.timestamp}`,
        record,
      })),
    ],
    [pageResults, recordResults]
  );

  // A fresh search always starts on the first result again.
  useEffect(() => {
    setActive(0);
  }, [needle]);

  // Closing on an outside click keeps the popup honest without a global listener
  // living past the component.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const commit = (result) => {
    if (!result) return;
    if (result.kind === "page") {
      navigate(result.link.to);
    } else {
      navigate("/history");
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        setOpen(false);
      }
      return;
    }
    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit(results[active]);
    }
  };

  const showPopup = open && needle.length > 0;
  const listboxId = "app-search-results";
  const optionId = (index) => `app-search-option-${index}`;

  let runningIndex = -1;

  return (
    <div ref={rootRef} className="relative w-full max-w-[420px]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label={t("search.label", language)}
          aria-expanded={showPopup}
          aria-controls={showPopup ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showPopup && results.length > 0 ? optionId(active) : undefined
          }
          placeholder={t("search.placeholder", language)}
          className="h-11 w-full rounded-control border border-transparent bg-surface-2 pl-11 pr-10 text-body-base text-fg placeholder:text-muted transition-colors duration-150 hover:bg-surface-3/60 focus:border-border-control focus:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-control text-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("search.clear", language)}</span>
          </button>
        )}
      </div>

      {showPopup && (
        // The popup owns the id the combobox points at, so `aria-controls`
        // resolves in the no-match state too, where the listbox itself is not
        // rendered and a reference to it would dangle.
        <div
          id={listboxId}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-tile border border-border-strong bg-surface shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-4 text-body-sm text-muted">
              {`${t("search.empty", language)} "${query.trim()}"`}
            </p>
          ) : (
            <ul
              role="listbox"
              aria-label={t("search.label", language)}
              className="max-h-[60vh] overflow-y-auto py-1"
            >
              {pageResults.length > 0 && (
                <li
                  role="presentation"
                  className="px-4 pb-1 pt-2 text-label uppercase text-muted"
                >
                  {t("search.pages", language)}
                </li>
              )}
              {results.map((result) => {
                runningIndex += 1;
                const index = runningIndex;
                const isActive = index === active;

                if (result.kind === "record" && index === pageResults.length) {
                  // The records group heading sits immediately before the first
                  // record, so it is emitted once, here.
                  return (
                    <React.Fragment key={`group-${result.id}`}>
                      <li
                        role="presentation"
                        className="px-4 pb-1 pt-3 text-label uppercase text-muted"
                      >
                        {t("search.records", language)}
                      </li>
                      <RecordOption
                        id={optionId(index)}
                        record={result.record}
                        language={language}
                        active={isActive}
                        onSelect={() => commit(result)}
                        onHover={() => setActive(index)}
                      />
                    </React.Fragment>
                  );
                }

                if (result.kind === "record") {
                  return (
                    <RecordOption
                      key={result.id}
                      id={optionId(index)}
                      record={result.record}
                      language={language}
                      active={isActive}
                      onSelect={() => commit(result)}
                      onHover={() => setActive(index)}
                    />
                  );
                }

                return (
                  <li
                    key={result.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => commit(result)}
                    className={`mx-1 flex min-h-[44px] cursor-pointer items-center rounded-control px-3 text-body-base ${
                      isActive ? "bg-surface-2 text-fg" : "text-fg-2"
                    }`}
                  >
                    {result.link.label}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="border-t border-border px-4 py-2 text-caption text-muted">
            {t("search.hint", language)}
          </p>
        </div>
      )}
    </div>
  );
};

const RecordOption = ({ id, record, language, active, onSelect, onHover }) => {
  const time = new Date(record.timestamp).toLocaleTimeString(
    language === "id" ? "id-ID" : "en-GB"
  );

  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`mx-1 flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-control px-3 text-body-base ${
        active ? "bg-surface-2 text-fg" : "text-fg-2"
      }`}
    >
      <span className="truncate">
        {t(`risk.${record.risk}`, language)}
      </span>
      <span className="shrink-0 tabular-data text-body-sm text-muted">
        {`${Number(record.peakPressure || 0).toFixed(1)} kPa`}
        <span className="mx-1.5 text-border-control">/</span>
        {time}
      </span>
    </li>
  );
};

export { AppSearch };
export default AppSearch;

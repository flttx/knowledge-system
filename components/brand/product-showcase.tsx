"use client";

import { useI18n } from "@/components/i18n/locale-provider";

export function ProductShowcase() {
  const { t } = useI18n();

  return (
    <div className="brand-desk" aria-label={t("brand.showcaseAriaLabel")}>
      <article className="brand-desk__note" data-narrative-item="true">
        <div className="brand-desk__meta">
          <span>{t("brand.demoNoteArea")}</span>
          <span className="brand-desk__seal">{t("brand.demoSaved")}</span>
        </div>
        <span className="brand-desk__eyebrow">{t("brand.demoNoteLabel")}</span>
        <h3>{t("brand.demoNoteTitle")}</h3>
        <p className="brand-desk__date">{t("brand.demoNoteDate")}</p>
        <div className="brand-desk__rule" />
        <p>{t("brand.demoNoteBody")}</p>
        <p className="brand-desk__quote">{t("brand.demoNoteHighlight")}</p>
        <p className="brand-desk__links">{t("brand.demoNoteFooter")}</p>
      </article>

      <aside className="brand-desk__slip brand-desk__slip--inbox" data-narrative-item="true">
        <span className="brand-desk__eyebrow">{t("brand.demoInboxLabel")}</span>
        <strong>{t("brand.demoInboxTitle")}</strong>
        <p>{t("brand.demoInboxItemThree")}</p>
        <span className="brand-desk__slip-mark" aria-hidden="true" />
      </aside>

      <aside className="brand-desk__slip brand-desk__slip--graph" data-narrative-item="true">
        <span className="brand-desk__eyebrow">{t("brand.demoGraphLabel")}</span>
        <div className="brand-desk__connection" aria-hidden="true">
          <span className="brand-desk__connection-node brand-desk__connection-node--one" />
          <span className="brand-desk__connection-line" />
          <span className="brand-desk__connection-node brand-desk__connection-node--two" />
        </div>
      </aside>
    </div>
  );
}

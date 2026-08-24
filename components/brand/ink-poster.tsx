import Image from "next/image";

import { useI18n } from "@/components/i18n/locale-provider";

export function InkPoster() {
  const { t } = useI18n();

  return (
    <figure className="brand-poster" data-brand-poster="true">
      <Image
        className="brand-poster__image"
        src="/brand/knowledge-ink-paper.webp"
        alt={t("brand.inkPosterAlt")}
        fill
        priority
        sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1280px) 48vw, 600px"
      />
      <figcaption className="brand-poster__caption">
        <span>{t("brand.inkPosterCaption")}</span>
        <span aria-hidden="true">01 / 04</span>
      </figcaption>
    </figure>
  );
}

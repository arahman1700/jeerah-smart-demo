import { Buildings } from "@phosphor-icons/react";
import { Carousel } from "../../../mobile/Carousel";
import assetManifest from "../../assets/asset-manifest.json";
import { assetUrl, type AssetManifestEntry } from "../../assets/url";
import type { Locale } from "../../domain/models";

const assetById = new Map<string, AssetManifestEntry>(
  (assetManifest as AssetManifestEntry[]).map((entry) => [entry.id, entry]),
);

export function getResidentAsset(id: string) {
  return assetById.get(id);
}

export function PropertyGallery({ imageIds, locale, label }: {
  imageIds: string[];
  locale: Locale;
  label: string;
}) {
  const images = imageIds.flatMap((id) => {
    const entry = getResidentAsset(id);
    return entry ? [entry] : [];
  });

  if (images.length === 0) {
    return (
      <div className="resident-gallery-fallback" role="img" aria-label={label}>
        <Buildings aria-hidden="true" weight="duotone" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Carousel ariaLabel={label} className="resident-gallery" contentClassName="resident-gallery__track">
      {images.map((entry) => (
        <figure className="resident-gallery__slide" key={entry.id}>
          <img src={assetUrl(entry.path)} alt={entry.alt[locale]} draggable={false} />
        </figure>
      ))}
    </Carousel>
  );
}

export function PropertyImage({ imageId, locale, label }: {
  imageId?: string;
  locale: Locale;
  label: string;
}) {
  const entry = imageId ? getResidentAsset(imageId) : undefined;
  if (!entry) {
    return (
      <span className="resident-property-image resident-property-image--fallback" role="img" aria-label={label}>
        <Buildings aria-hidden="true" weight="duotone" />
      </span>
    );
  }
  return <img className="resident-property-image" src={assetUrl(entry.path)} alt={entry.alt[locale]} draggable={false} />;
}

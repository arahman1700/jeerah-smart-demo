import { IconContext, type Icon } from "@phosphor-icons/react";

export function BrandIcon({ icon: Glyph, label }: { icon: Icon; label: string }) {
  return (
    <IconContext.Provider value={{ weight: "duotone", size: 24 }}>
      <Glyph aria-label={label} />
    </IconContext.Provider>
  );
}

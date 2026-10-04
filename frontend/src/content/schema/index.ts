// src/content/schema/index.ts
import { PageSchema } from './types';
import { GLOBAL_SETTINGS_SCHEMA, DEFAULT_SITE_SETTINGS } from './globalSchema';
import { HOME_PAGE_SCHEMA } from './homeSchema';
import { CLIENT_PAGE_SCHEMA } from './clientSchema';
import { DEMO_PAGE_SCHEMA } from './demoSchema';
import { FAQ_PAGE_SCHEMA } from './faqSchema';
import { CONTACT_PAGE_SCHEMA } from './contactSchema';
import { PORTFOLIO_INDEX_SCHEMA } from './portfolioSchema';
import { TERMS_PAGE_SCHEMA, PRIVACY_PAGE_SCHEMA } from './legalSchema';

export * from './types';
export * from './globalSchema';
export * from './homeSchema';
export * from './clientSchema';
export * from './demoSchema';
export * from './faqSchema';
export * from './contactSchema';
export * from './portfolioSchema';
export * from './legalSchema';

export const ALL_PAGE_SCHEMAS: PageSchema[] = [
  GLOBAL_SETTINGS_SCHEMA,
  HOME_PAGE_SCHEMA,
  CLIENT_PAGE_SCHEMA,
  PORTFOLIO_INDEX_SCHEMA,
  DEMO_PAGE_SCHEMA,
  FAQ_PAGE_SCHEMA,
  CONTACT_PAGE_SCHEMA,
  TERMS_PAGE_SCHEMA,
  PRIVACY_PAGE_SCHEMA,
];

export function getPageSchema(pageKey: string): PageSchema | undefined {
  return ALL_PAGE_SCHEMAS.find((s) => s.pageKey === pageKey);
}

export function getDefaultPageContent(pageKey: string): Record<string, any> {
  const schema = getPageSchema(pageKey);
  if (!schema) return {};

  const content: Record<string, any> = {};

  for (const section of schema.sections) {
    const sectionData: Record<string, any> = {
      visible: section.defaultVisible !== undefined ? section.defaultVisible : true,
    };

    for (const field of section.fields) {
      sectionData[field.key] = field.default !== undefined ? field.default : '';
    }

    if (section.photoSlots) {
      for (const slot of section.photoSlots) {
        sectionData[slot.key] = slot.defaultPhotos || [];
      }
    }

    content[section.id] = sectionData;
  }

  return content;
}

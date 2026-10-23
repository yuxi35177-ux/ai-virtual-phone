// The legacy owner keeps the original databases. No history is moved or deleted.
// Scope is fixed for this document: late replies in an old tab cannot write to
// the next persona's databases. Switching always starts a fresh document.
export const PERSONA_REGISTRY_KEY = "float_phone_personas_v1";
export type PersonaRegistry = { version: 1; ownerId: string; activeId: string; ownerName: string };
export function readPersonaRegistry(): PersonaRegistry | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PERSONA_REGISTRY_KEY);
  if (!raw) return null;
  const r = JSON.parse(raw) as PersonaRegistry;
  if (r.version !== 1 || !r.ownerId || !r.activeId) throw new Error("人设索引读取失败，请勿清理数据。");
  return r;
}
const initial = typeof window === "undefined" ? null : readPersonaRegistry();
let documentRegistry = initial;
export function currentPersonaRegistry() { return documentRegistry; }
export function initializePersonaRegistry(identitiesRaw: string | null, bindingsRaw: string | null): PersonaRegistry {
  if (documentRegistry) return documentRegistry;
  const identities = identitiesRaw ? JSON.parse(identitiesRaw) as {id: string; name: string}[] : [];
  const binding = bindingsRaw ? JSON.parse(bindingsRaw) : null;
  const id = binding?.globalDefaults?.userIdentityId;
  const owner = identities.find(i => i.id === id) || identities[0];
  const r: PersonaRegistry = { version: 1, ownerId: owner?.id || "__legacy_unset__", activeId: owner?.id || "__legacy_unset__", ownerName: owner?.name || "未设置身份（原存档）" };
  window.localStorage.setItem(PERSONA_REGISTRY_KEY, JSON.stringify(r));
  documentRegistry = r;
  return r;
}
const HISTORY_DATABASES = new Set(["AiPhoneKvDB", "AiPhoneChatDB", "AiPhoneMomentsDB", "ai_phone_memory_db_v1", "AiPhoneStoryDB", "AiPhoneVnDB", "AiPhoneMapDB", "AiPhoneDwellingDB", "AiPhoneCheckPhoneDB", "AiPhoneMascotDB", "AiPhoneQaDB", "reading-db", "reading-raw-files"]);
export function personaDatabaseName(name: string): string {
  if (!initial || initial.activeId === initial.ownerId || !HISTORY_DATABASES.has(name)) return name;
  return `${name}__persona_${encodeURIComponent(initial.activeId)}`;
}
export const SHARED_PERSONA_KEYS = new Set([
  "ai_phone_user_identities_v1", "ai_phone_bindings_v1", "ai_phone_api_configs_v1", "ai_phone_voice_configs_v1", "ai_phone_image_generation_settings_v1", "ai_phone_char_settings_v1",
  "ai_phone_characters_v1", "ai_phone_bg_items_v1", "ai_phone_character_worlds_v1", "ai_phone_custom_apps_v1", "ai_phone_custom_app_icon_styles_v1",
]);
// Only used for storage fallbacks / legacy migrations, never for the registry.
export function personaLocalKey(key: string): string {
  if (SHARED_PERSONA_KEYS.has(key)) return key;
  const name = personaDatabaseName("AiPhoneKvDB");
  return name === "AiPhoneKvDB" ? key : `${name}:${key}`;
}
export const personaLocalStorage = {
  getItem(key: string) { return window.localStorage.getItem(personaLocalKey(key)); },
  setItem(key: string, value: string) { window.localStorage.setItem(personaLocalKey(key), value); },
  removeItem(key: string) { window.localStorage.removeItem(personaLocalKey(key)); },
  get length() { return this.keys().length; },
  key(index: number) { return this.keys()[index] ?? null; },
  keys(): string[] {
    const prefix = personaDatabaseName("AiPhoneKvDB") + ":";
    const scoped = prefix !== "AiPhoneKvDB:";
    return Object.keys(window.localStorage).flatMap(k => scoped ? (k.startsWith(prefix) ? [k.slice(prefix.length)] : SHARED_PERSONA_KEYS.has(k) ? [k] : []) : k.includes("__persona_") ? [] : [k]);
  },
};
export async function preparePersonaSwitch(activeId: string): Promise<void> {
  const r = documentRegistry;
  if (!r) throw new Error("人设存档尚未准备好，请稍后重试。");
  // A read/write transaction queues behind pending writes in each opened store.
  // No records are modified; wait for the barriers before reloading.
  for (const base of HISTORY_DATABASES) {
    const name = personaDatabaseName(base);
    const known = await indexedDB.databases();
    if (!known.some(d => d.name === name)) continue;
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(name);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const stores = Array.from(db.objectStoreNames);
        if (!stores.length) { db.close(); resolve(); return; }
        const tx = db.transaction(stores, "readwrite");
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = tx.onerror = () => { db.close(); reject(tx.error); };
      };
    });
  }
  // Do not change the document's frozen scope until it has been replaced.
  window.localStorage.setItem(PERSONA_REGISTRY_KEY, JSON.stringify({ ...r, activeId }));
  window.location.reload();
}

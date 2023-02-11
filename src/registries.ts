export const NPMJS_REGISTRY_HOST = "registry.npmjs.org";

let registries: Set<string> = new Set<string>([NPMJS_REGISTRY_HOST]);
let allRegistries: boolean = false;

export const setRegistriesConfiguration = (setAllRegistries: boolean, newRegistries?: string[]): void => {
    allRegistries = setAllRegistries;
    registries = new Set<string>([NPMJS_REGISTRY_HOST]);
    if (newRegistries?.length) {
        newRegistries.forEach((reg) => registries.add(reg));
    }
};

export const isRegistrySupported = (host: string): boolean => {
    if (!host) {
        return false;
    }
    return allRegistries || registries.has(host);
};

export const NPMJS_REGISTRY_URL: URL = new URL("https://registry.npmjs.org");

let registriesHostNames: Set<string> = new Set<string>([NPMJS_REGISTRY_URL.hostname]);
let allRegistries: boolean = false;

export const setRegistriesConfiguration = (setAllRegistries: boolean, newRegistries?: URL[]): void => {
    allRegistries = setAllRegistries;
    registriesHostNames = new Set<string>([NPMJS_REGISTRY_URL.hostname]);
    if (newRegistries?.length) {
        newRegistries.forEach((registryUrl: URL) => registriesHostNames.add(registryUrl.hostname));
    }
};

export const isRegistrySupported = (url: URL): boolean => {
    if (!url?.hostname) {
        return false;
    }
    return allRegistries || registriesHostNames.has(url?.hostname);
};

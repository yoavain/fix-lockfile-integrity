import { isRegistrySupported, NPMJS_REGISTRY_URL, setRegistriesConfiguration } from "../src/registries";

describe("Test registries configuration", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Should support only npmjs by default", () => {
        expect(isRegistrySupported(NPMJS_REGISTRY_URL)).toBeTruthy();
        expect(isRegistrySupported(new URL("https://some.registry.com"))).toBeFalsy();
    });
    it("Should support any registry, when allRegistries is set to true", () => {
        setRegistriesConfiguration(true);

        expect(isRegistrySupported(NPMJS_REGISTRY_URL)).toBeTruthy();
        expect(isRegistrySupported(new URL("https://some.registry.com"))).toBeTruthy();
    });
    it("Should support specific registry, when set", () => {
        setRegistriesConfiguration(false, [new URL("https://some.registry.com")]);

        expect(isRegistrySupported(NPMJS_REGISTRY_URL)).toBeTruthy();
        expect(isRegistrySupported(new URL("https://some.registry.com"))).toBeTruthy();
        expect(isRegistrySupported(new URL("https://other.registry.com"))).toBeFalsy();
    });
    it("Should return false if registry is missing", () => {
        setRegistriesConfiguration(false);

        expect(isRegistrySupported({} as URL)).toBeFalsy();
    });
});

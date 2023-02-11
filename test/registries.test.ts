import { isRegistrySupported, NPMJS_REGISTRY_HOST, setRegistriesConfiguration } from "../src/registries";

describe("Test registries configuration", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Should support only npmjs by default", () => {
        expect(isRegistrySupported(NPMJS_REGISTRY_HOST)).toBeTruthy();
        expect(isRegistrySupported("some.registry.com")).toBeFalsy();
    });
    it("Should support any registry, when allRegistries is set to true", () => {
        setRegistriesConfiguration(true);

        expect(isRegistrySupported(NPMJS_REGISTRY_HOST)).toBeTruthy();
        expect(isRegistrySupported("some.registry.com")).toBeTruthy();
    });
    it("Should support specific registry, when set", () => {
        setRegistriesConfiguration(false, ["some.registry.com"]);

        expect(isRegistrySupported(NPMJS_REGISTRY_HOST)).toBeTruthy();
        expect(isRegistrySupported("some.registry.com")).toBeTruthy();
        expect(isRegistrySupported("other.registry.com")).toBeFalsy();
    });
    it("Should return false if registry is missing", () => {
        setRegistriesConfiguration(false);

        expect(isRegistrySupported("")).toBeFalsy();
    });
});

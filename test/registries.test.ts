import { isRegistrySupported, NPMJS_REGISTRY_HOST, setAllRegistries, setRegistries } from "../src/registries";

describe("Test registries configuration", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Should support only npmjs by default", () => {
        expect(isRegistrySupported(NPMJS_REGISTRY_HOST)).toBeTruthy();
        expect(isRegistrySupported("some.registry.com")).toBeFalsy();
    });
    it("Should support any registry, when allRegistries is set to true", () => {
        setAllRegistries();

        expect(isRegistrySupported(NPMJS_REGISTRY_HOST)).toBeTruthy();
        expect(isRegistrySupported("some.registry.com")).toBeTruthy();
    });
    it("Should support specific registry, when set", () => {
        setAllRegistries(false);
        setRegistries(["some.registry.com"]);

        expect(isRegistrySupported(NPMJS_REGISTRY_HOST)).toBeTruthy();
        expect(isRegistrySupported("some.registry.com")).toBeTruthy();
        expect(isRegistrySupported("other.registry.com")).toBeFalsy();
    });
});

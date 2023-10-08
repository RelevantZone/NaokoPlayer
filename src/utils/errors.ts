class ProviderError extends Error {
    public constructor(provider: string, message: string) {
        super(`(Provider ${provider}): ${message}`);
    }
}
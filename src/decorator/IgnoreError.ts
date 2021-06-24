export function IgnoreError(warningMessage?: string) {
    return function (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<void>>) {
        const originalFn = descriptor.value!;

        descriptor.value = async function (...args) {
            try {
                await originalFn.apply(this, args);
            } catch (e) {
                console.warn(`[${propertyKey}] failed, skipped`);
                if (warningMessage) {
                    console.warn("---------------------------------------------");
                    console.warn("ATTENTION:");
                    console.warn(warningMessage);
                    console.warn("---------------------------------------------");
                }
                console.warn(e);
            }
        };
    };
}

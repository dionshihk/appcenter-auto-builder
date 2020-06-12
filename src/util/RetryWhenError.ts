import Utility from "./Utility";

export function RetryWhenError(maxRetryTimes: number = 2, interval: number = 10) {
    let retryTimes = 0;
    return function (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<void>>) {
        const originalFn = descriptor.value!;

        descriptor.value = async function (...args) {
            while (true) {
                try {
                    await originalFn.apply(this, args);
                    break;
                } catch (e) {
                    console.warn(`Function [${propertyKey}] failed, retry in ${interval} seconds, error info:`);
                    console.warn(e);
                    if (retryTimes < maxRetryTimes) {
                        await Utility.delay(interval);
                        retryTimes++;
                    } else {
                        throw e;
                    }
                }
            }
        };
    };
}

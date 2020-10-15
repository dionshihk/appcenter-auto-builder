import {AppCenterUtility} from "./AppCenterUtility";

export function RetryWhenError(maxRetryTimes: number = 2, interval: number = 3) {
    let retryTimes = 0;
    return function (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<void>>) {
        const originalFn = descriptor.value!;

        descriptor.value = async function (...args) {
            while (true) {
                try {
                    await originalFn.apply(this, args);
                    break;
                } catch (e) {
                    console.warn(`[${propertyKey}] failed, retry in ${interval} seconds, error:`);
                    console.warn(e);
                    if (retryTimes < maxRetryTimes) {
                        await AppCenterUtility.delay(interval);
                        retryTimes++;
                    } else {
                        throw e;
                    }
                }
            }
        };
    };
}

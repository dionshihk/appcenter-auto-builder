import {AppCenterUtility} from "./AppCenterUtility";

const RETRY_INTERVAL = 10; // In second

export function RetryWhenError(maxRetryTimes: number = 3) {
    let retryTimes = 0;
    return function (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) {
        const originalFn = descriptor.value!;

        descriptor.value = async function (...args) {
            while (true) {
                try {
                    return await originalFn.apply(this, args);
                } catch (e) {
                    console.warn(`[${propertyKey}] failed, retry in ${RETRY_INTERVAL} seconds, error:`);
                    console.warn(e);
                    if (retryTimes < maxRetryTimes) {
                        await AppCenterUtility.delay(RETRY_INTERVAL);
                        retryTimes++;
                    } else {
                        throw e;
                    }
                }
            }
        };
    };
}

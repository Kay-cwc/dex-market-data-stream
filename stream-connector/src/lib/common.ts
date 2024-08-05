export const assertUnreachable = (x: never): never => {
    throw new Error(`Unexpected object: ${x}`);
};

export const isValidEnumOrThrow = <T>(enumType: Record<string, T>, value: string): T => {
    if (Object.values(enumType).includes(value as T)) {
        return value as T;
    }
    throw new Error(`Invalid enum value: ${value}`);
};

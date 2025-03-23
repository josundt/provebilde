export type UniformValue = number | number[] | Float32Array | Int32Array;

type PickByValue<T, ValueType> = Pick<
    T,
    { [Key in keyof T]-?: T[Key] extends ValueType ? Key : never }[keyof T]
>;

export type WebGLConstant = keyof PickByValue<WebGLRenderingContext, number>;

type PreciceProperty<S extends Schema> = S & { required?: true };
type Property = { required?: true } & Schema;
type PropertiesSchema = { [K in PropertyKey]: Property };
type ObjectSchema = { kind: 'object', properties: PropertiesSchema };
type TupleSchema = { kind: 'tuple', types: Readonly<Schema[]> }
type ArraySchema = { kind: 'array', element: Schema }
type NumberSchema = { kind: 'number' };
type StringSchema = { kind: 'string' };
type NullSchema = { kind: 'null' };
type AnySchema = { kind: 'any' };
type OneOfSchema = { kind: 'one-of', types: Readonly<Schema[]> };
type AllOfSchema = { kind: 'all-of', types: Readonly<Schema[]> };
type ExactSchema = { kind: 'exact', value: unknown };
type GuardSchema = { kind: 'guard', check: (t: unknown) => boolean };
type Schema
    = AnySchema
    | OneOfSchema
    | AllOfSchema
    | ExactSchema
    | TupleSchema
    | ObjectSchema
    | ArraySchema
    | NumberSchema
    | StringSchema
    | NullSchema
    | GuardSchema

type RequiredKey<KS extends Property, K> = KS extends { required: true } ? K : never;
type TypeOfObject<OS extends PropertiesSchema> =
    { [K in keyof OS]?: TypeOf<OS[K]> }
    & { [K in keyof OS as RequiredKey<OS[K], K>]: TypeOf<OS[K]> };
type TypeOfTuple<S extends Readonly<Schema[]>> =
      S extends Readonly<[]>
    ? []
    : S extends Readonly<[infer T, ...infer Args]>
    ? T extends Schema
        ? Args extends Readonly<Schema[]>
            ? [TypeOf<T>, ...TypeOfTuple<Args>]
            : never
        : never
    : YouForgotConst[];
type TypeOfOneOf<S extends Readonly<Schema[]>> =
      S extends Readonly<[]>
    ? never
    : S extends Readonly<[infer T, ...infer Args]>
    ? T extends Schema
        ? Args extends Readonly<Schema[]>
            ? (TypeOf<T> | TypeOfOneOf<Args>)
            : unknown
        : unknown
    : YouForgotConst;
type TypeOfAllOf<S extends Readonly<Schema[]>> =
      S extends Readonly<[]>
    ? unknown
    : S extends Readonly<[infer T, ...infer Args]>
    ? T extends Schema
        ? Args extends Readonly<Schema[]>
            ? (TypeOf<T> & TypeOfAllOf<Args>)
            : unknown
        : unknown
    : YouForgotConst;
type InferGuard<F extends (t: any) => boolean> =
    F extends (t: any) => t is infer G ? G : UseExplicitTypeGuard;

type TypeOf<S extends Schema> =
      S extends AnySchema
    ? any
    : S extends OneOfSchema
    ? TypeOfOneOf<S['types']>
    : S extends AllOfSchema
    ? TypeOfAllOf<S['types']>
    : S extends ExactSchema
    ? (S['value'] extends infer A ? A : never)
    : S extends GuardSchema
    ? InferGuard<S['check']>
    : S extends TupleSchema
    ? TypeOfTuple<S['types']>
    : S extends ObjectSchema
    ? TypeOfObject<S['properties']>
    : S extends ArraySchema
    ? TypeOf<S['element']>[]
    : S extends NumberSchema
    ? number
    : S extends StringSchema
    ? string
    : S extends NullSchema
    ? null
    : YouForgotConst;

// An alias for "unknown" that is more effective for the user to see
// `t is YouForgotConst <--> t is unknown`
interface YouForgotConst {}
interface UseExplicitTypeGuard {}
// Attach some fake properties to make the type "unique"
const MARKER = Symbol();
type HiddenCovariance<S> = (_: typeof MARKER) => S;
export type Validator<S> = { (t: unknown): t is S; [MARKER]: HiddenCovariance<S> };
export type SchemaValidator<S extends Schema> = Validator<TypeOf<S>>;

function compileNull<S extends NullSchema>(_: S): SchemaValidator<S> {
    return function validateNull(o: unknown): o is null {
        // console.log(`null`, o);
        return o === null;
    } as SchemaValidator<S>; // TS can't figure this out?
}
function compileString<S extends StringSchema>(_: S): SchemaValidator<S> {
    return function validateString(o: unknown): o is string {
        // console.log(`string`, o);
        return typeof o === "string";
    } as SchemaValidator<S>; // TS can't figure this out?
}
function compileNumber<S extends NumberSchema>(_: S): SchemaValidator<S> {
    return function validateNumber(o: unknown): o is number {
        // console.log(`number`, o);
        return typeof o === "number";
    } as SchemaValidator<S>; // TS can't figure this out?
}
function compileArray<S extends ArraySchema>(s: S): SchemaValidator<S> {
    const validateElement = compile(s.element);
    return function validateArray(o: unknown): o is TypeOf<S> {
        if (o instanceof Array) {
            // console.group(`array`, o);
            const valid = o.every((v) => validateElement(v));
            // console.log(`result: ${valid}`)
            // console.groupEnd();
            return valid;
        }
        return false;
    } as SchemaValidator<S>;
}
function compileAny<S extends AnySchema>(_: S): SchemaValidator<S> {
    return function validateAny(_t: unknown): _t is TypeOf<S> {
        return true;
    } as SchemaValidator<S>;
}
function compileOneOf<S extends OneOfSchema>(s: S): SchemaValidator<S> {
    const validators = s.types.map(t => compile(t));
    // console.debug(validators);
    return function validateOneOf(t: unknown): t is TypeOf<S> {
        // console.group(`one-of`, t);
        const valid = validators.some(v => v(t));
        // console.log(`result: ${valid}`)
        // console.groupEnd();
        return valid;
    } as SchemaValidator<S>;
}
function compileAllOf<S extends AllOfSchema>(s: S): SchemaValidator<S> {
    const validators = s.types.map(t => compile(t));
    // console.debug(validators);
    return function validateOneOf(t: unknown): t is TypeOf<S> {
        // console.group(`all-of`, t);
        const valid = validators.every(v => v(t));
        // console.log(`result: ${valid}`)
        // console.groupEnd();
        return valid;
    } as SchemaValidator<S>;
}
function compileExact<S extends ExactSchema>(s: S): SchemaValidator<S> {
    const value = s.value;
    return function validateExact(t: unknown): t is (S['value'] extends infer A ? A : never) {
        // console.group(`exact`, t);
        const valid = t === value;
        // console.log(`result: ${valid}`)
        // console.groupEnd();
        return valid;
    } as SchemaValidator<S>;
}
function compileGuard<S extends GuardSchema>(s: S): SchemaValidator<S> {
    const check = s.check;
    return check as SchemaValidator<S>;
}
function compileTuple<S extends TupleSchema>(s: S): SchemaValidator<S> {
    const validators = s.types.map(v => compile(v));
    return function validateTuple(t: unknown): t is TypeOf<S> {
        if (!(t instanceof Array)) {
            return false;
        }
        if (t.length !== validators.length) {
            return false;
        }
        for (let i = 0; i < validators.length; i++) {
            const validate = validators[i];
            const value = t[i];
            if (!validate(value)) {
                return false;
            }
        }
        return true;
    } as SchemaValidator<S>;
}
function compileObject<S extends ObjectSchema>(s: S): SchemaValidator<S> {
    const validators: {
        [K in keyof S['properties']]: (o: any) => boolean
    } = {} as any;
    function compileProperty<
        O extends object,
        K extends keyof O,
        S extends Schema,
        PS extends PreciceProperty<S>
    >(prop: K, propSchema: PS):
        (t: O) => t is O & { [T in K as RequiredKey<PS, T>]: TypeOf<S> }
    {
        const { required } = propSchema;
        const propertyValidator = compile(propSchema);
        if (required) {
            function validateRequiredProperty(t: O): t is O & { [T in K]: TypeOf<S> } {
                // console.group(`>property ${prop} (required)`, t);
                const valid = prop in t && propertyValidator(t[prop]);
                // console.log(`result: ${valid}`)
                // console.groupEnd();
                return valid;
            }
            // TS can't handle it... again
            return validateRequiredProperty as any;
        } else {
            function validateOptionalProperty(t: O): t is O & { [T in K]?: TypeOf<S> } {
                // console.group(`>property ${prop} (optional)`, t);
                const valid = !(prop in t) || propertyValidator(t[prop]);
                // console.log(`result: ${valid}`)
                // console.groupEnd();
                return valid;
            }
            // TS can't handle it... again
            return validateOptionalProperty as any;
        }
    }
    const properties: S["properties"] = s.properties;
    for (const k in properties) {
        validators[k] = compileProperty(k, properties[k]);
    }
    const propertyValidator = Object.entries(validators).map(([_, v]) => v);
    return function validateObject(t: unknown): t is TypeOf<S> {
        // console.group(`object`, t);
        const valid = typeof t === 'object' && propertyValidator.every(v => v(t));
        // console.log(`result: ${valid}`)
        // console.groupEnd();
        return valid;
    } as SchemaValidator<S>;
}

export function compile<S extends Schema>(s: S): SchemaValidator<S> {
    // in each case, TS sees that s: [Kind]Schema, but not that S extends [KindSchema],
    // so we have to cast some stuff explicitly
    switch (s.kind) {
        case 'any':    return compileAny<AnySchema>(s) as SchemaValidator<S>;
        case 'null':   return compileNull<NullSchema>(s) as SchemaValidator<S>;
        case 'string': return compileString<StringSchema>(s) as SchemaValidator<S>;
        case 'number': return compileNumber<NumberSchema>(s) as SchemaValidator<S>;
        case 'array':  return compileArray<ArraySchema>(s) as SchemaValidator<S>;
        case 'tuple':  return compileTuple<TupleSchema>(s) as SchemaValidator<S>;
        case 'one-of': return compileOneOf<OneOfSchema>(s) as SchemaValidator<S>;
        case 'all-of': return compileAllOf<AllOfSchema>(s) as SchemaValidator<S>;
        case 'exact':  return compileExact<ExactSchema>(s) as SchemaValidator<S>;
        case 'guard':  return compileGuard<GuardSchema>(s) as SchemaValidator<S>;
        case 'object': return compileObject<ObjectSchema>(s) as SchemaValidator<S>;
    }
}

import { compile, Validator } from "./rpc/validate";

type ByteUnit = "B"
type TimeUnit = "s" | "ms"
type PerfUnit = `ops/${TimeUnit}` | `${TimeUnit}/ops`
type ScalarUnit = ByteUnit | TimeUnit | PerfUnit

interface ScalarMeasurement {
    kind: "scalar",
    unit: ScalarUnit,
    value: number
};
export type Measurement = ScalarMeasurement;
function genericFormatter(measure: ScalarMeasurement): string {
    return `${measure.value}${measure.unit}`;
}

export const FORMATTERS: {
    [K in ScalarUnit]: (m: Measurement & { kind: "scalar", unit: K }) => string;
} = {
    ["B"]: genericFormatter,
    ["s"]: genericFormatter,
    ["ms"]: genericFormatter,
    ["ops/s"]: genericFormatter,
    ["ops/ms"]: genericFormatter,
    ["s/ops"]: genericFormatter,
    ["ms/ops"]: genericFormatter,
};
export function formatMeasurement(m: Measurement): string {
    switch (m.unit) {
        case "B":  return FORMATTERS["B"]({ ...m, unit: "B" })
        case "s":  return FORMATTERS["s"]({ ...m, unit: "s" })
        case "ms": return FORMATTERS["ms"]({ ...m, unit: "ms" })
        case "ops/s": return FORMATTERS["ops/s"]({ ...m, unit: "ops/s" })
        case "ops/ms": return FORMATTERS["ops/ms"]({ ...m, unit: "ops/ms" })
        case "s/ops": return FORMATTERS["s/ops"]({ ...m, unit: "s/ops" })
        case "ms/ops": return FORMATTERS["ms/ops"]({ ...m, unit: "ms/ops" })
    }
}

export type Datapoint = { id: string } & Measurement;

export const datapointValidator: Validator<Datapoint> = compile({
    kind: "all-of",
    types: [{
        kind: "object",
        properties: {
            id: { required: true, kind: "string" },
        },
    }, {
        kind: "one-of",
        types: [{
            kind: "object",
            properties: {
                kind: { required: true, kind: "exact", value: "scalar", },
                unit: {
                    required: true,
                    kind: "one-of",
                    types: [
                        { kind: "exact", value: "B" },
                        { kind: "exact", value: "s" },
                        { kind: "exact", value: "ms" },
                        { kind: "exact", value: "ops/s" },
                        { kind: "exact", value: "ops/ms" },
                        { kind: "exact", value: "s/ops" },
                        { kind: "exact", value: "ms/ops" },
                    ],
                },
                value: { required: true, kind: "number" },
            }
        }]
    }]
} as const)
